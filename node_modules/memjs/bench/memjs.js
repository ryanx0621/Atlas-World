var memjs = require("memjs");
var header = require('header');
var b = require("benchmark");

function makeString(n) {
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var text = "";
  var i;

  for(i=0; i < n; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

var x = (function() {
  var suite = new b.Suite();

  var headerBuf = Buffer.from([0x81, 1, 7, 0, 4, 0, 0, 1, 0, 0, 0, 9, 0, 0, 0, 0, 0x0a, 0, 0, 0, 0, 0, 0, 0]);
  var parsedHeader = header.fromBuffer(headerBuf);

  suite.add('Header#fromBuffer', function() {
    header.fromBuffer(headerBuf);
  })
  .add('Header#toBuffer', function() {
    header.toBuffer(parsedHeader);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  // run async
  .run({ 'async': true });
}());

x = (function() {
  var suite = new b.Suite();
  var responseHeader = {
    magic: 0x81,
    opcode: 1,
    keyLength: 15,
    extrasLength: 0,
    dataType: 0,
    status: 1,
    totalBodyLength: 1024 * 10 + 15,
    opaque: 0,
    cas: Buffer.from([0x0a, 0, 0, 0, 0, 0, 0, 0])
  };
  var buf = Buffer.alloc(24 + 15 + 1024 * 10);
  header.toBuffer(responseHeader).copy(buf);
  buf.write(makeString(55));

  var server = new memjs.Server();

  var dummyFunc = function(arg) {
    server.onResponse(dummyFunc);
    return arg;
  };

  var i;
  for (i = 0; i < 10; i++) {
    server.onResponse(dummyFunc);
  }

  suite.add('Server#respond', function() {
    server.respond('helloworldthisisatesttohowmuchyouareaversetocopyingoverthestargatecommisionandromanticizingaboutmylifelongpassionforlearningandyieldingtoyourdesires');
  })
  .add('Server#responseHandler', function() {
    server.responseHandler(buf);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  // run async
  .run({ 'async': true });
}());

x = (function() {
  var suite = new b.Suite();
  var client = memjs.Client.create();

  suite.cycles = 0;
  suite.add('Client#get', function() {
    client.get("hello", function(/* err, val */) {
      suite.cycles++;
    });
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target) + "     " + suite.cycles);
  });
  client.set("hello", makeString(10240), function(/* err, val */) {
    // run async
    suite.run({ 'async': true });
  });
}());
