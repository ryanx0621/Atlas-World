
exports.libVersion = require('./package.json').version;
exports.version = '3.1';	// this is the WordNet DB version
exports.path = require('path').join(__dirname, 'dict');
try{
exports.files = require('fs').readdirSync(exports.path);
} catch(e) {
  console.log(e.message);
}
