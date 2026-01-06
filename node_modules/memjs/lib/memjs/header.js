// # MemJS Memcache binary protocol header

// fromBuffer converts a serialized header to a JS object.
exports.fromBuffer = function(headerBuf) {
  if (!headerBuf) {
    return {};
  }
  return {
    magic:           headerBuf.readUInt8(0),
    opcode:          headerBuf.readUInt8(1),
    keyLength:       headerBuf.readUInt16BE(2),
    extrasLength:    headerBuf.readUInt8(4),
    dataType:        headerBuf.readUInt8(5),
    status:          headerBuf.readUInt16BE(6),
    totalBodyLength: headerBuf.readUInt32BE(8),
    opaque:          headerBuf.readUInt32BE(12),
    cas:             headerBuf.slice(16, 24)
  };
};

// toBuffer converts a JS memcache header object to a binary memcache header
exports.toBuffer = function(header) {
  var headerBuf = Buffer.alloc(24);
  headerBuf.fill();
  headerBuf.writeUInt8(header.magic, 0);
  headerBuf.writeUInt8(header.opcode, 1);
  headerBuf.writeUInt16BE(header.keyLength, 2);
  headerBuf.writeUInt8(header.extrasLength, 4);
  headerBuf.writeUInt8(header.dataType || 0, 5);
  headerBuf.writeUInt16BE(header.status || 0, 6);
  headerBuf.writeUInt32BE(header.totalBodyLength, 8);
  headerBuf.writeUInt32BE(header.opaque || 0, 12);
  if (header.cas) {
    header.cas.copy(headerBuf, 16);
  } else {
    headerBuf.fill('\x00', 16);
  }
  return headerBuf;
};
