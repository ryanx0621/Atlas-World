var test = require('tap').test;
var errors = require('../lib/memjs/protocol').errors;
var MemJS = require('../');

test('GetSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    n += 1;
    dummyServer.respond(
      {header: {status: 0, opaque: request.header.opaque},
        val: 'world', extras: 'flagshere'});
  };

  var client = new MemJS.Client([dummyServer]);
  var assertor = function(err, val, flags) {
    t.equal('world', val);
    t.equal('flagshere', flags);
    t.equal(null, err);
    t.equal(1, n, 'Ensure get is called');
  };
  client.get('hello', assertor);
  n = 0;
  return client.get('hello').then(function(res) {
    assertor(null, res.value, res.flags);
  });
});

test('GetNotFound', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    n += 1;
    dummyServer.respond(
      {header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  var assertor = function(val, flags) {
    t.equal(null, val);
    t.equal(null, flags);
    t.equal(1, n, 'Ensure get is called');
    t.end();
  };
  client.get('hello', assertor);
  n = 0;
  return client.get('hello').then(function(res) {
    assertor(null, res.value, res.extras);
  });
});

test('GetSerializer', function(t) {
  var n = 0;
  var dn = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    n += 1;
    dummyServer.respond(
      {header: {status: 0, opaque: request.header.opaque},
        val: 'world', extras: 'flagshere'});
  };

  var client = new MemJS.Client([dummyServer], {
    serializer: {
      serialize: function(opcode, value, extras){
        return { value: value, extras: extras };
      },
      deserialize: function (opcode, value, extras) {
        dn += 1;
        return { value: 'deserialized', extras: extras };
      }
    }
  });
  var assertor = function(err, val, flags) {
    t.equal('deserialized', val);
    t.equal('flagshere', flags);
    t.equal(null, err);
    t.equal(1, n, 'Ensure get is called');
    t.equal(1, dn, 'Ensure deserialization is called once');
  };
  client.get('hello', assertor);
  n = 0;
  dn = 0;
  return client.get('hello').then(function(res) {
    assertor(null, res.value, res.flags);
  });
});

test('SetSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  var assertor = function(err, val) {
    t.equal(true, val);
    t.equal(null, err);
    t.equal(1, n, 'Ensure set is called');
  };
  client.set('hello', 'world', {}, assertor);
  n = 0;
  return client.set('hello', 'world', {}).then(function (success){
    assertor(null, success);
  });
});

test('SetSuccessfulWithoutOption', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.set('hello', 'world', function(err, val) {
    t.equal(true, val);
    t.equal(null, err);
    t.equal(1, n, 'Ensure set is called');
    t.end();
  });
});

test('SetPromiseWithoutOption', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  return client.set('hello', 'world').then(function(val) {
    t.equal(true, val);
    t.equal(1, n, 'Ensure set is called');
    t.end();
  });
});

test('SetWithExpiration', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('\0\0\0\0\0\0\4\0', request.extras.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.set('hello', 'world', {}, function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure set is called');
    t.end();
  });
});

test('SetUnsuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 3, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  var assertor = function(err, val) {
    t.equal(null, val);
    t.equal('MemJS SET: ' + errors[3], err.message);
    t.equal(1, n, 'Ensure set is called');
  };
  client.set('hello', 'world', {}, assertor);
  n = 0;
  return client.set('hello', 'world', {}).catch(function(err) {
    assertor(err, null);
  });
});

test('SetError', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.error({message: 'This is an expected error.'});
  };

  var client = new MemJS.Client([dummyServer]);
  client.set('hello', 'world', {}, function(err, val) {
    t.notEqual(null, err);
    t.equal('This is an expected error.', err.message);
    t.equal(null, val);
    t.equal(2, n, 'Ensure set is retried once');
    t.end();
  });
});

test('SetError', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    setTimeout(function() {
      n += 1;
      dummyServer.error({message: 'This is an expected error.'});
    }, 100);
  };

  var client = new MemJS.Client([dummyServer], {retries: 2});
  client.set('hello', 'world', {}, function(err /*, val */) {
    t.equal(2, n, 'Ensure set is retried once');
    t.ok(err, 'Ensure callback called with error');
    t.equal('This is an expected error.', err.message);
    t.end();
  });
});

test('SetErrorConcurrent', function(t) {
  var n = 0;
  var callbn1 = 0;
  var callbn2 = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(/* requestBuf */) {
    n += 1;
    dummyServer.error({message: 'This is an expected error.'});
  };

  var client = new MemJS.Client([dummyServer], {retries: 2});
  client.set('hello', 'world', {}, function(err /*, val */) {
    t.ok(err, 'Ensure callback called with error');
    t.equal('This is an expected error.', err.message);
    callbn1 += 1;
    done();
  });

  client.set('foo', 'bar', {}, function(err /*, val */) {
    t.ok(err, 'Ensure callback called with error');
    t.equal('This is an expected error.', err.message);
    callbn2 += 1;
    done();
  });

  var done =(function() {
    var called = 0;
    return function() {
      called += 1;
      if (called < 2) return;
      t.equal(1, callbn1, 'Ensure callback 1 is called once');
      t.equal(1, callbn2, 'Ensure callback 2 is called once');
      t.equal(4, n, 'Ensure error sent twice for each set call');
      t.end();
    };
  })();
});

test('SetUnicode', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('éééoào', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.set('hello', 'éééoào', {}, function(err, val) {
    t.equal(true, val);
    t.equal(1, n, 'Ensure set is called');
    t.end();
  });
});

test('SetSerialize', function(t) {
  var n = 0;
  var sn = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('serialized', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 3, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {
    serializer: {
      serialize: function(opcode, value, extras){
        sn += 1;
        return { value: 'serialized', extras: extras };
      },
      deserialize: function (opcode, value, extras) {
        return { value: value, extras: extras };
      }
    }
  });
  var assertor = function(err, val) {
    t.equal(null, val);
    t.equal('MemJS SET: ' + errors[3], err.message);
    t.equal(1, n, 'Ensure set is called');
    t.equal(1, sn, 'Ensure serialization is called once');
  };
  client.set('hello', 'world', {}, assertor);
  n = 0;
  sn = 0;
  return client.set('hello', 'world', {}).catch(function(err) {
    assertor(err, null);
  });
});

test('AddSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('0000000000000400', request.extras.toString('hex'));
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  var assertor = function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure add is called');
  };
  client.add('hello', 'world', {}, assertor);
  n = 0;
  return client.add('hello', 'world', {}).then(function(success) {
    assertor(null, success);
  });
});

test('AddSuccessfulWithoutOption', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('0000000000000400', request.extras.toString('hex'));
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.add('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure add is called');
    t.end();
  });
});

test('AddKeyExists', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 2, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.add('hello', 'world', {}, function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure add is called');
    t.end();
  });
});

test('AddSerializer', function(t) {
  var n = 0;
  var sn = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('serialized', request.val.toString());
    t.equal('0000000100000400', request.extras.toString('hex'));
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {
    expires: 1024,
    serializer: {
      serialize: function(opcode, value, extras){
        sn += 1;
        extras.writeUInt32BE(1, 0);
        return { value: 'serialized', extras: extras };
      },
      deserialize: function (opcode, value, extras) {
        return { value: value, extras: extras };
      }
    }
  });
  var assertor = function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure add is called');
    t.equal(1, sn, 'Ensure serialization is called once');
  };
  client.add('hello', 'world', {}, assertor);
  n = 0;
  sn = 0;
  return client.add('hello', 'world', {}).then(function(success) {
    assertor(null, success);
  });
});

test('ReplaceSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('\0\0\0\0\0\0\4\0', request.extras.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  var assertor = function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure replace is called');
  };
  client.replace('hello', 'world', {}, assertor);
  n = 0;
  return client.replace('hello', 'world', {}).then(function(success){
    assertor(null, success);
  });
});

test('ReplaceSuccessfulWithoutOption', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('\0\0\0\0\0\0\4\0', request.extras.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.replace('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure replace is called');
    t.end();
  });
});

test('ReplaceKeyDNE', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.replace('hello', 'world', {}, function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure replace is called');
    t.end();
  });
});

test('DeleteSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  var assertor = function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure delete is called');
  };
  client.delete('hello', assertor);
  n = 0;
  return client.delete('hello').then(function(success) {
    assertor(null, success);
  });
});

test('DeleteKeyDNE', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.delete('hello', function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure delete is called');
    t.end();
  });
});

test('Flush',  function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.host = 'example.com';
  dummyServer.port = 1234;
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal(0x08, request.header.opcode);
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer, dummyServer]);
  var assertor = function(err, results) {
    t.equal(null, err);
    t.equal(true, results['example.com:1234']);
    t.equal(2, n, 'Ensure flush is called for each server');
  };
  client.flush(assertor);
  n = 0;
  return client.flush().then(function(results) {
    assertor(null, results);
  });
});

test('Stats', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.host = 'myhostname';
  dummyServer.port = 5544;
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal(0x10, request.header.opcode);
    n += 1;
    dummyServer.respond({
      header: {status: 0, totalBodyLength: 9, opaque: request.header.opaque},
      key: 'bytes', val: '1432'});
    dummyServer.respond({
      header: {status: 0, totalBodyLength: 9, opaque: request.header.opaque},
      key: 'count', val: '5432'});
    dummyServer.respond({
      header: {status: 0, totalBodyLength: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.stats(function(err, server, stats) {
    t.equal(null, err);
    t.equal('1432', stats.bytes);
    t.equal('5432', stats.count);
    t.equal('myhostname:5544', server);
    t.equal(1, n, 'Ensure stats is called');
    t.end();
  });
});

test('IncrementSuccessful', function(t) {
  var n = 0;
  var callbn = 0;
  var dummyServer = new MemJS.Server();

  var expectedExtras = [
    '\0\0\0\0\0\0\0\5\0\0\0\0\0\0\0\0\0\0\0\0',
    '\0\0\0\0\0\0\0\5\0\0\0\0\0\0\0\3\0\0\0\0'
  ];

  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal(5, request.header.opcode);
    t.equal('number-increment-test', request.key.toString());
    t.equal('', request.val.toString());
    t.equal(expectedExtras[n], request.extras.toString());
    n += 1;
    process.nextTick(function() {
      var value = Buffer.alloc(8);
      value.writeUInt32BE(request.header.opcode + 1, 4);
      value.writeUInt32BE(0, 0);
      dummyServer.respond({header: {status: 0, opaque: request.header.opaque}, val: value});
    });
  };

  var client = new MemJS.Client([dummyServer]);
  client.increment('number-increment-test', 5, {}, function(err, success, val){
    callbn += 1;
    t.equal(true, success);
    t.equal(6, val);
    t.equal(null, err);
    done();
  });

  client.increment('number-increment-test', 5, { initial: 3 }, function(err, success, val) {
    callbn += 1;
    t.equal(true, success);
    t.equal(6, val);
    t.equal(null, err);
    done();
  });

  var done =(function() {
    var called = 0;
    return function() {
      called += 1;
      if (called < 2) return;
      t.equal(2, n, 'Ensure increment is called twice');
      t.equal(2, callbn, 'Ensure callback is called twice');
      t.end();
    };
  })();
});

test('DecrementSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal(6, request.header.opcode);
    t.equal('number-decrement-test', request.key.toString());
    t.equal('', request.val.toString());
    t.equal('\0\0\0\0\0\0\0\5\0\0\0\0\0\0\0\0\0\0\0\0', request.extras.toString());
    n += 1;
    process.nextTick(function() {
      var value = Buffer.alloc(8);
      value.writeUInt32BE(request.header.opcode, 4);
      value.writeUInt32BE(0, 0);
      dummyServer.respond({header: {status: 0, opaque: request.header.opaque}, val: value});
    });
  };

  var client = new MemJS.Client([dummyServer]);
  client.decrement('number-decrement-test', 5, {}, function(err, success, val) {
    t.equal(true, success);
    t.equal(6, val);
    t.equal(null, err);
    t.equal(1, n, 'Ensure decr is called');
    t.end();
  });
});

test('DecrementSuccessfulWithoutOption', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal(6, request.header.opcode);
    t.equal('number-decrement-test', request.key.toString());
    t.equal('', request.val.toString());
    t.equal('\0\0\0\0\0\0\0\5\0\0\0\0\0\0\0\0\0\0\0\0', request.extras.toString());
    n += 1;
    process.nextTick(function() {
      var value = Buffer.alloc(8);
      value.writeUInt32BE(request.header.opcode, 4);
      value.writeUInt32BE(0, 0);
      dummyServer.respond({header: {status: 0, opaque: request.header.opaque}, val: value});
    });
  };

  var client = new MemJS.Client([dummyServer]);
  client.decrement('number-decrement-test', 5, function(err, success, val) {
    t.equal(true, success);
    t.equal(6, val);
    t.equal(null, err);
    t.equal(1, n, 'Ensure decr is called');
    t.end();
  });
});

test('AppendSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.append('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure append is called');
    t.end();
  });
});

test('AppendKeyDNE', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.append('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure append is called');
    t.end();
  });
});

test('PrependSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.prepend('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure prepend is called');
    t.end();
  });
});

test('PrependKeyDNE', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.prepend('hello', 'world', function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure prepend is called');
    t.end();
  });
});

test('TouchSuccessful', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('', request.val.toString());
    t.equal('\0\0\4\0', request.extras.toString());
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.touch('hello', 1024, function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure touch is called');
    t.end();
  });
});

test('TouchKeyDNE', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('', request.val.toString());
    t.equal('\0\0\4\0', request.extras.toString());
    n += 1;
    dummyServer.respond({header: {status: 1, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer]);
  client.touch('hello', 1024, function(err, val) {
    t.equal(null, err);
    t.equal(false, val);
    t.equal(1, n, 'Ensure ptouch is called');
    t.end();
  });
});

test('Failover', function(t) {
  var n1 = 0;
  var n2 = 0;
  var dummyServer1 = new MemJS.Server();
  dummyServer1.write = function(/* requestBuf*/) {
    n1 += 1;
    dummyServer1.error(new Error('connection failure'));
  };
  var dummyServer2 = new MemJS.Server();
  dummyServer2.write = function(requestBuf) {
    n2 += 1;
    var request = MemJS.Utils.parseMessage(requestBuf);
    dummyServer2.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer1, dummyServer2], {failover: true});
  client.get('\0', function(err/*, val */){
    t.equal(null, err);
    t.equal(2, n1);
    t.equal(1, n2);
    t.end();
  });

});

test('Very Large Client Seq', function(t) {
  var n = 0;
  var dummyServer = new MemJS.Server();
  dummyServer.write = function(requestBuf) {
    var request = MemJS.Utils.parseMessage(requestBuf);
    t.equal('hello', request.key.toString());
    t.equal('world', request.val.toString());
    t.equal('0000000000000400', request.extras.toString('hex'));
    n += 1;
    dummyServer.respond({header: {status: 0, opaque: request.header.opaque}});
  };

  var client = new MemJS.Client([dummyServer], {expires: 1024});
  client.seq = Math.pow(2,33);
  var assertor = function(err, val) {
    t.equal(null, err);
    t.equal(true, val);
    t.equal(1, n, 'Ensure add is called');
  };
  client.add('hello', 'world', {}, assertor);
  n = 0;
  return client.add('hello', 'world', {}).then(function(success) {
    assertor(null, success);
  });
});
return;
