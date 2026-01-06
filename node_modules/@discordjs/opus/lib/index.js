const { resolve } = require('node:path');
const { find } = require('@discordjs/node-pre-gyp');

// eslint-disable-next-line import/no-dynamic-require
module.exports = require(find(resolve(__dirname, '..', 'package.json')));
