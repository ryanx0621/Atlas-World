var net = require('net');
var events = require('events');
var util = require('util');
var makeRequestBuffer = require('./utils').makeRequestBuffer;
var parseMessage = require('./utils').parseMessage;
var merge = require('./utils').merge;
var timestamp = require('./utils').timestamp;

var Server = function(host, port, username, password, options) {
  events.EventEmitter.call(this);
  this.responseBuffer = Buffer.from([]);
  this.host = host;
  this.port = port;
  this.connected = false;
  this.timeoutSet = false;
  this.connectCallbacks = [];
  this.responseCallbacks = {};
  this.requestTimeouts = [];
  this.errorCallbacks = {};
  this.options = merge(options || {}, {timeout: 0.5, keepAlive: false, keepAliveDelay: 30});
  if (this.options.conntimeout === undefined || this.options.conntimeout === null) {
    this.options.conntimeout = 2 * this.options.timeout;
  }
  this.username = username || this.options.username || process.env.MEMCACHIER_USERNAME || process.env.MEMCACHE_USERNAME;
  this.password = password || this.options.password || process.env.MEMCACHIER_PASSWORD || process.env.MEMCACHE_PASSWORD;
  return this;
};

util.inherits(Server, events.EventEmitter);

Server.prototype.onConnect = function(func) {
  this.connectCallbacks.push(func);
};

Server.prototype.onResponse = function(seq, func) {
  this.responseCallbacks[seq] = func;
};

Server.prototype.respond = function(response) {
  var callback = this.responseCallbacks[response.header.opaque];
  if (!callback) {
    // in case of authentication, no callback is registered
    return;
  }
  callback(response);
  if (!callback.quiet || response.header.totalBodyLength === 0) {
    delete(this.responseCallbacks[response.header.opaque]);
    this.requestTimeouts.shift();
    delete(this.errorCallbacks[response.header.opaque]);
  }
};

Server.prototype.onError = function(seq, func) {
  this.errorCallbacks[seq] = func;
};

Server.prototype.error = function(err) {
  var errcalls = this.errorCallbacks;
  this.connectCallbacks = [];
  this.responseCallbacks = {};
  this.requestTimeouts = [];
  this.errorCallbacks = {};
  this.timeoutSet = false;
  if (this._socket) {
    this._socket.destroy();
    delete(this._socket);
  }
  var k;
  for (k in errcalls) {
    if (errcalls.hasOwnProperty(k)) {
      errcalls[k](err);
    }
  }
};

Server.prototype.listSasl = function() {
  var buf = makeRequestBuffer(0x20, '', '', '');
  this.writeSASL(buf);
};

Server.prototype.saslAuth = function() {
  var authStr = '\x00' + this.username + '\x00' + this.password;
  var buf = makeRequestBuffer(0x21, 'PLAIN', '', authStr);
  this.writeSASL(buf);
};

Server.prototype.appendToBuffer = function(dataBuf) {
  var old = this.responseBuffer;
  this.responseBuffer = Buffer.alloc(old.length + dataBuf.length);
  old.copy(this.responseBuffer, 0);
  dataBuf.copy(this.responseBuffer, old.length);
  return this.responseBuffer;
};

Server.prototype.responseHandler = function(dataBuf) {
  var response = parseMessage(this.appendToBuffer(dataBuf));
  var respLength;
  while (response) {
    if (response.header.opcode === 0x20) {
      this.saslAuth();
    } else if (response.header.status === 0x20) {
      this.error('Memcached server authentication failed!');
    } else if (response.header.opcode === 0x21) {
      this.emit('authenticated');
    } else {
      this.respond(response);
    }
    respLength = response.header.totalBodyLength + 24;
    this.responseBuffer = this.responseBuffer.slice(respLength);
    response = parseMessage(this.responseBuffer);
  }
};

Server.prototype.sock = function(sasl, go) {
  var self = this;

  if (!self._socket) {
    // CASE 1: completely new socket
    self.connected = false;
    self._socket = net.connect(this.port, this.host, function() {

      // SASL authentication handler
      self.once('authenticated', function() {
        if (self._socket) {
          self.connected = true;
          // cancel connection timeout
          self._socket.setTimeout(0);
          self.timeoutSet = false;
          // run actual request(s)
          go(self._socket);
          self.connectCallbacks.forEach(function(cb) {
            cb(self._socket);
          });
          self.connectCallbacks = [];
        }
      });

      // setup response handler
      this.on('data', function(dataBuf) {
        self.responseHandler(dataBuf);
      });

      // kick of SASL if needed
      if (self.username && self.password) {
        self.listSasl();
      } else {
        self.emit('authenticated');
      }
    });

    // setup error handler
    self._socket.on('error', function(error) {
      self.error(error);
    });

    self._socket.on('close', function() {
      self.connected = false;
      if (self.timeoutSet) {
        self._socket.setTimeout(0);
        self.timeoutSet = false;
      }
      self._socket = undefined;
    });

    // setup connection timeout handler
    self.timeoutSet = true;
    self._socket.setTimeout(self.options.conntimeout * 1000, function() {
      self.timeoutSet = false;
      if (!self.connected) {
        this.end();
        self._socket = undefined;
        self.error(new Error('socket timed out connecting to server.'));
      }
    });

    // use TCP keep-alive
    self._socket.setKeepAlive(self.options.keepAlive, self.options.keepAliveDelay * 1000);

  } else if (!self.connected && !sasl) {
    // CASE 2: socket exists, but still connecting / authenticating
    self.onConnect(go);

  } else {
    // CASE 3: socket exists and connected / ready to use
    go(self._socket);
  }
};

// We handle tracking timeouts with an array of deadlines (requestTimeouts), as
// node doesn't like us setting up lots of timers, and using just one is more
// efficient anyway.
var timeoutHandler = function(server, sock) {
  if (server.requestTimeouts.length === 0) {
    // nothing active
    server.timeoutSet = false;
    return;
  }

  // some requests outstanding, check if any have timed-out
  var now = timestamp();
  var soonestTimeout = server.requestTimeouts[0];

  if (soonestTimeout <= now) {
    // timeout occurred!
    sock.end();
    server.connected = false;
    server._socket = undefined;
    server.timeoutSet = false;
    server.error(new Error('socket timed out waiting on response.'));
  } else {
    // no timeout! Setup next one.
    var deadline = soonestTimeout - now;
    sock.setTimeout(deadline, function() {
      timeoutHandler(server, sock);
    });
  }
};

Server.prototype.write = function(blob) {
  var self = this;
  var deadline = Math.round(self.options.timeout * 1000);
  this.sock(false, function(s) {
    s.write(blob);
    self.requestTimeouts.push(timestamp() + deadline);
    if (!self.timeoutSet) {
      self.timeoutSet = true;
      s.setTimeout(deadline, function() {
        timeoutHandler(self, this);
      });
    }
  });
};

Server.prototype.writeSASL = function(blob) {
  this.sock(true, function(s) {
    s.write(blob);
  });
};

Server.prototype.close = function() {
  if (this._socket) { this._socket.end(); }
};

Server.prototype.toString = function() {
  return '<Server ' + this.host + ':' + this.port + '>';
};

exports.Server = Server;
