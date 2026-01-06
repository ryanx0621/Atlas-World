wordnet-db
==========

[![NPM version](https://img.shields.io/npm/v/wordnet-db.svg)](https://www.npmjs.com/package/wordnet-db)
[![Build Status](https://img.shields.io/travis/moos/wordnet-db/master.svg)](https://travis-ci.org/moos/wordnet-db)


A package to install [WordNet](http://wordnet.princeton.edu) database files for Node.js modules. Used by [wordpos](http://github.com/moos/wordpos) project which is based on [natural](http://github.com/NaturalNode/natural) WordNet module.

**Note:** This repository was previously name **WNdb**.  Its new name complies with npm naming rules.  Although old links will still work, it is recommended to change references to the new name.


Description
------------

This package contains the core DB files of WordNet 3.1 downloaded from [WordNet files](http://wordnet.princeton.edu/download/current-version/).

~~Other "[standoff](https://wordnet.princeton.edu/download)" files may be added in the future.~~

The purpose of this package is to allow a convenient way to download WordNet files off-line rather than on-demand for node modules that require it.

Installation
------------

```
  npm install wordnet-db
```

Package is about __10 MB__ in size and uncompresses to about 34 MB.  <del>The DB file wordnet-db-3.1.tar.gz is unpacked at install time.</del>


Usage
-------
```js
var wndb = require('wordnet-db');
console.log(wndb);
// output:
{ libVersion: '3.1.13',
  version: '3.1',
  path: 'D:\\dev\\wordnet-db\\dict',
  files:
   [ 'data.adj',
     'data.adv',
     'data.noun',
     'data.verb',
     'index.adj',
     'index.adv',
     'index.noun',
     'index.sense',
     'index.verb' ]
}
```

Properties
------------

`wndb.path` (string) -- the path to the installed WordNet DB files

`wndb.files` (array&lt;string&gt;) -- list of file names under the path

`wndb.version` (string) -- version string of WordNet database file

`wndb.libVersion` (string) -- version of wordnet-db package


Change log
---------
- 3.1.14 -- Added `libVersion`.
- 3.1.13 -- Remove WN tar.gz from npm package.
- 3.1.12 -- remove `tar` dependency.
- 3.1.11 -- move `tar` to devDependencies - fix crlf issue.  Add pre-publish test for crlf.
- ~~3.1.7/8/9/10 -- move `tar` to devDependencies~~
- 3.1.6 -- fix for npm@5 postinstall order issue.  Include /dict files and disable postinstall script.
- 3.1.4 -- Updated with PR #12.  Fix npm package.
- 3.1.2 -- repository renamed to wordnet-db.
- 3.1.1 -- fixed WNdb tar folder structure.
- 3.1.0 -- updated to WordNet 3.1 DB.
- 3.0.1 -- this includes the actual WordNet tar file, which is unpacked at install time.  There should be no CRLF issues.  Uses build-in 'zlib' package, therefore requires node >= 0.6.
- 3.0.0 -- includes the uncompressed (text) dict files.  **On Windows systems, do a `git config core.autocrlf false` before _cloning_ so that CRLF isn't applied to data files.**
- 3.0.x are pegged to WordNet 3.0 DB.


License
-------

wordnet-db package:
Copyright (c) 2012-2020, mooster@42at.com
(The MIT License)

See LICENSE file for complete Princeton University WordNet(r) License.
