// # MemJS utility functions

var header = require('./header');

var bufferify = function(val) {
  return Buffer.isBuffer(val) ? val : Buffer.from(val);
};

exports.makeRequestBuffer = function(opcode, key, extras, value, opaque) {
  key = bufferify(key);
  extras = bufferify(extras);
  value = bufferify(value);
  var buf = Buffer.alloc(24 + key.length + extras.length + value.length);
  buf.fill();
  var requestHeader = {
    magic: 0x80,
    opcode: opcode,
    keyLength: key.length,
    extrasLength: extras.length,
    totalBodyLength: key.length + value.length + extras.length,
    opaque: opaque
  };
  header.toBuffer(requestHeader).copy(buf);
  extras.copy(buf, 24);
  key.copy(buf, 24 + extras.length);
  value.copy(buf, 24 + extras.length + key.length);
  return buf;
};

exports.makeAmountInitialAndExpiration = function(amount, amountIfEmpty, expiration) {
  var buf = Buffer.alloc(20);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(amount, 4);
  buf.writeUInt32BE(0, 8);
  buf.writeUInt32BE(amountIfEmpty, 12);
  buf.writeUInt32BE(expiration, 16);
  return buf;
};

exports.makeExpiration = function(expiration) {
  var buf = Buffer.alloc(4);
  buf.writeUInt32BE(expiration, 0);
  return buf;
};

exports.hashCode = function(str) {
  var ret, i, len;
  for(ret = 0, i = 0, len = str.length; i < len; i++) {
    ret = (31 * ret + str.charCodeAt(i)) << 0;
  }
  return Math.abs(ret);
};

exports.parseMessage = function(dataBuf) {
  if (dataBuf.length < 24) {
    return false;
  }
  var responseHeader = header.fromBuffer(dataBuf);
  if (dataBuf.length < responseHeader.totalBodyLength + 24 ||
      responseHeader.totalBodyLength <
        responseHeader.keyLength + responseHeader.extrasLength) {
    return false;
  }

  var pointer = 24;
  var extras = dataBuf.slice(pointer, pointer + responseHeader.extrasLength);
  pointer += responseHeader.extrasLength;
  var key = dataBuf.slice(pointer, pointer + responseHeader.keyLength);
  pointer += responseHeader.keyLength;
  var val = dataBuf.slice(pointer, 24 + responseHeader.totalBodyLength);

  return {header: responseHeader, key: key, extras: extras, val: val};
};

exports.merge = function(original, deflt) {
  var attr, originalValue;
  for (attr in deflt) {
    if (deflt.hasOwnProperty(attr)) {
      originalValue = original[attr];

      if (originalValue === undefined || originalValue === null) {
        original[attr] = deflt[attr];
      }
    }
  }
  return original;
};

// timestamp provides a monotonic timestamp with millisecond accuracy, useful
// for timers.
exports.timestamp = function() {
  var times = process.hrtime();
  return (times[0] * 1000) + Math.round((times[1] / 1000000));
};

if(!Buffer.concat) {
  Buffer.concat = function(list, length) {
    if (!Array.isArray(list)) {
      throw new Error('Usage: Buffer.concat(list, [length])');
    }

    if (list.length === 0) {
      return Buffer.alloc(0);
    }
    if (list.length === 1) {
      return list[0];
    }

    var i, buf;

    if (typeof length !== 'number') {
      length = 0;
      for (i = 0; i < list.length; i++) {
        buf = list[i];
        length += buf.length;
      }
    }

    var buffer = Buffer.alloc(length);
    var pos = 0;
    for (i = 0; i < list.length; i++) {
      buf = list[i];
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer;
  };
}
