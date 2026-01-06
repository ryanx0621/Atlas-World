var noopSerializer = {
  serialize: function (opcode, value, extras) {
    return { value: value, extras: extras };
  },
  deserialize: function (opcode, value, extras) {
    return { value: value, extras: extras };
  }
};

exports.noopSerializer = noopSerializer;
