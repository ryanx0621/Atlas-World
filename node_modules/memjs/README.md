MemJS
=====

[![npm](http://img.shields.io/npm/v/memjs.svg)](https://www.npmjs.com/package/memjs)
[![Build Status](https://secure.travis-ci.org/alevy/memjs.png)](http://travis-ci.org/alevy/memjs?branch=master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/alevy/memjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

MemJS is a pure Node.js client library for using memcache, in particular, the
[MemCachier](http://memcachier.com/) service. It
uses the binary protocol and support SASL authentication.

Documentation can be found here: [https://memjs.netlify.com/](https://memjs.netlify.com/)

## TOC

  1. [Requirements](#requirements)
  2. [Installation](#installation)
  3. [Configuration](#configuration)
  4. [Usage](#usage)
  5. [How to help](#contributing)

## Requirements

### Supported Node.js versions ###

MemJS is tested to work with version 0.10 or higher of Node.js.

## Installation ##

MemJS is available from the npm registry:

    $ npm install memjs

To install from git:

    $ git clone git://github.com/alevy/memjs.git
    $ cd memjs
    $ npm link

MemJS was designed for the MemCachier memcache service but will work with any
memcache server that speaks the binary protocol. Many software repositories
have a version of memcached available for installation:

### Ubuntu ###

    $ apt-get install memcached

### OS X ###

    $ brew install memcached

## Configuration ##

MemJS understands the following environment variables:

* `MEMCACHIER_SERVERS` - used to determine which servers to connect to. Should be a comma separated list of _[hostname:port]_.
* `MEMCACHIER_USERNAME` - if present with `MEMCACHIER_PASSWORD`, MemJS will try to authenticated to the server using SASL.
* `MEMCACHIER_PASSWORD` - if present with `MEMCACHIER_USERNAME`, MemJS will try to authenticated to the server using SASL.
* `MEMCACHE_USERNAME` - used if `MEMCACHIER_USERNAME` is not present
* `MEMCACHE_PASSWORD` - used if `MEMCACHIER_PASSWORD` is not present

Environment variables are only used as a fallback for explicit parameters.

## Usage ##

You can start using MemJS immediately from the node console:

    $ var memjs = require('memjs')
    $ var client = memjs.Client.create()
    $ client.get('hello', function(err, val) { console.log(val); })

If callbacks are not specified, the command calls return promises.

### Settings Values

``` javascript
client.set('hello', 'world', {expires:600}, function(err, val) {

});
```

The `set(key, val, options, callback)` function accepts the following parameters.

* `key`: key to set
* `val`: value to set
* `options`: an object of options. Currently supports only the key `expires`, which is a time interval, in seconds, after which memcached will expire the object
* `callback`: a callback invoked after the value is set
  * `err` : error
  * `val` : value retrieved


### Getting Values

``` javascript
client.get('hello', function(err, val) {

});
```

The `get(key, callback)` function accepts the following parameters.

Note that values are always returned as `Buffer`s, regardless of whether a
`Buffer` or `String` was passed to `set`.

* `key`: key to retrieve
* `callback`: a callback invoked after the value is retrieved
  * `err` : error
  * `val` : value retrieved as a `Buffer`

## Contributing

The best way to contribute to the project is by reporting bugs and testing unpublished
versions. If you have a staging or development app, the easiest way to do this is
using the git repository as your `memjs` package dependency---in `package.json`:

    {
      "name": "MyAppName",
      ...
      "dependencies": {
        ...
        "memjs": "git://github.com/alevy/memjs.git#master"
        ...
      }
    }

If you find a bug, please report as an [issue](https://github.com/alevy/memjs/issues/new).
If you fix it, please don't hesitate to send a pull request on GitHub or via
[e-mail](http://www.kernel.org/pub/software/scm/git/docs/git-request-pull.html).

Feature suggestions are also welcome! These includes suggestions about syntax and interface
design.

Finally, a great way to contribute is to implement a feature that's missing and send a pull
request. The list below contains some planned features that have not been addressed yet. You
can also implement a feature not a list if you think it would be good.

### TODOS ###

* Support flags
* Support multi commands
* Support CAS
* Consistent hashing for keys and/or pluggable hashing algorithm

## Copyright ##

Copyright (c) 2012 Amit Levy, MemCachier. See LICENSE for details.
