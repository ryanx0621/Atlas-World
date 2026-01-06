// # MemJS Memcache binary protocol errors

exports.errors = {};
exports.errors[0x0000] = 'No error';
exports.errors[0x0001] = 'Key not found';
exports.errors[0x0002] = 'Key exists';
exports.errors[0x0003] = 'Value too large';
exports.errors[0x0004] = 'Invalid arguments';
exports.errors[0x0005] = 'Item not stored';
exports.errors[0x0006] = 'Incr/Decr on non-numeric value';
exports.errors[0x0007] = 'The vbucket belongs to another server';
exports.errors[0x0008] = 'Authentication error';
exports.errors[0x0009] = 'Authentication continue';
exports.errors[0x0081] = 'Unknown command';
exports.errors[0x0082] = 'Out of memory';
exports.errors[0x0083] = 'Not supported';
exports.errors[0x0084] = 'Internal error';
exports.errors[0x0085] = 'Busy';
exports.errors[0x0086] = 'Temporary failure';
