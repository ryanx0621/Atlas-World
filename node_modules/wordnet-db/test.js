var wn = require('./index');
const detectNewline = require('detect-newline');
var fs = require('fs');
var path = require('path');
var bad = false;

// verify all dict\ files have \n line-ending
wn.files.forEach(function(file, index) {
  const fc = fs.readFileSync(path.join(wn.path, file), 'utf-8');
  const endingType = detectNewline(fc);

  if (endingType !== '\n') {
    console.log(' ✖', file, JSON.stringify(endingType));
    bad |= true;
  } else {
    console.log('✔', file, JSON.stringify(endingType))
  }

  if (index === wn.files.length - 1) {
    // done:
    process.exit(bad ? 1 : 0)
  }
});
