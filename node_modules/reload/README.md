reload
=======

[![Build Status](https://github.com/alallier/reload/workflows/CI/badge.svg)](https://github.com/alallier/reload/actions?query=workflow%3ACI)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![codecov](https://codecov.io/gh/alallier/reload/branch/master/graph/badge.svg)](https://codecov.io/gh/alallier/reload)
[![NPM version](https://img.shields.io/npm/v/reload.svg)](https://www.npmjs.com/package/reload)

Automatically refresh and reload your code in your browser when your code changes. No browser plugins required.

Table Of Contents
---
* [Why](#why)
* [How does it work?](#how-does-it-work)
* [Installation](#installation)
* [Two ways to use reload](#two-ways-to-use-reload)
* [Using reload in Express](#using-reload-in-express)
  * [Express Example](#express-example)
  * [Manually firing server-side reload events](#manually-firing-server-side-reload-events)
    * [Manual fire with promises](#manual-fire-with-promises)
    * [Manual fire with async/await](#manual-fire-with-asyncawait)
  * [API for Express](#api-for-express)
    * [With try/catch](#with-trycatch)
    * [With async/await](#with-asyncawait)
    * [Parameters](#parameters)
      * [Table of reload parameters](#table-of-reload-parameters)
      * [Table of options for reload opts parameter](#table-of-options-for-reload-opts-parameter)
    * [Returns](#returns)
* [Using reload as a command line application](#using-reload-as-a-command-line-application)
  * [Usage for Command Line Application](#usage-for-command-line-application)
* [License](#license)

Why?
----

Restarting your HTTP server and refreshing your browser is annoying.

How does it work?
----------

Reload works in two different ways depending on if you're using it:

1. In an existing Express application in which it creates a server side route for reload or,
2. As a command line tool which starts its own Express application to monitor the file you're editing for changes and to serve `reload-client.js` to the browser.

Once reload-server and reload-client are connected, the client side code opens a [WebSocket](https://en.wikipedia.org/wiki/WebSocket) to the server and waits for the WebSocket to close, once it closes, reload waits for the server to come back up (waiting for a socket on open event), once the socket opens we reload the page.

Installation
---

    npm install [-g] [--save-dev] reload


Two ways to use reload
---

There are two different ways to use reload.

1. In an [Express](http://expressjs.com/) application, allowing your whole project to utilize reload when the code is altered
2. As a command line application to serve up static HTML files and be able to reload when the code is altered

Using reload in Express
---
When used with Express **reload creates** a new Express route for reload. When you restart the server, the client will detect the server being restarted and automatically refresh the page.

Reload can be used in conjunction with tools that allow for automatically restarting the server such as [supervisor](https://github.com/isaacs/node-supervisor) (recommended), [nodemon](https://github.com/remy/nodemon), [forever](https://github.com/nodejitsu/forever), etc.

### Express Example

**`server.js`:**
```javascript
var express = require('express')
var http = require('http')
var path = require('path')
var reload = require('reload')
var bodyParser = require('body-parser')
var logger = require('morgan')

var app = express()

var publicDir = path.join(__dirname, 'public')

app.set('port', process.env.PORT || 3000)
app.use(logger('dev'))
app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded

app.get('/', function (req, res) {
  res.sendFile(path.join(publicDir, 'index.html'))
})

var server = http.createServer(app)

// Reload code here
reload(app).then(function (reloadReturned) {
  // reloadReturned is documented in the returns API in the README

  // Reload started, start web server
  server.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })
}).catch(function (err) {
  console.error('Reload could not start, could not start server/sample app', err)
})
```

**`public/index.html`:**
```html
<!doctype html>
<html>
  <head>
    <title>Reload Express Sample App</title>
  </head>
  <body>
    <h1>Reload Express Sample App</h1>
    <!-- All you have to do is include the reload script and have it be on every page of your project -->
    <!-- You do not create this route, reload creates it for you automatically -->
    <script src="/reload/reload.js"></script>
  </body>
</html>
```

**Refer to the [reload express sample app](https://github.com/alallier/reload-sample-app) for this working example.**

### Manually firing server-side reload events

You can manually call a reload event by calling `reload()` yourself. An example is shown below:

#### Manual fire with promises
```javascript
reload(app).then((reloadReturned) => {
  watch.watchTree(__dirname + "/public", function (f, curr, prev) {
    // Fire server-side reload event
    reloadReturned.reload();
  });
})
```

#### Manual fire with async/await

```js
const startServer = async () => {
    const reloadReturned = await reload(app);

    watch.watchTree(__dirname + "/public", function (f, curr, prev) {
        // Fire server-side reload event
        reloadReturned.reload();
    })
}
```

### API for Express

Reload returns a promise. The API takes a required express application and an optional options object. The promise returns an object (for information on the returned object [see below](#returns)).

#### With try/catch

To call Reload you should use a then/catch to call reload.

* ```javascript
    reload(app [,opts]).then(function (reloadReturned) {
      // reloadReturned object see returns documentation below for what is returned

      // Reload started
    }).catch(function (err) {
      // Reload did not start correctly, handle error
    })
  ```

#### With async/await

If you are in an [asynchronous function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) you can call Reload with [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

* ```javascript
  async function asyncCall() {
    try {
      var reloadReturned = await reload(app [,opts])
      // reloadReturned object see returns documentation below for what is returned.
    } catch (err) {
      // Handle error
    }
  }
  ```

_Consult the [migration guide](MIGRATION_GUIDE.md) for help updating reload across major versions._

#### Parameters

##### Table of reload parameters

| Parameter Name | Type     | Description                                                                                                         | Optional |
|----------------|----------|---------------------------------------------------------------------------------------------------------------------|----------|
| app            | object   | The app. It may work with other frameworks, or even with Connect. At this time, it's only been tested with Express. |          |
| opts           | object   | An optional object of options for reload. Refer to table [below](#table-of-options-for-reload-opts-parameter) on possible options                                  | ✓        |

##### Table of options for reload opts parameter

| Parameter Name           | Type    | Description                                                                                                                                                                                                                                                                                                                                                                                                 | Optional | Default |
|--------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|---------|
| port                     | number  | Port to run reload on.                                                                                                                                                                                                                                                                                                                                                                                      | ✓        | 9856    |
| webSocketServerWaitStart | boolean | When enabled will delay starting and opening WebSocket server when requiring reload. After enabling use the startWebSocketServer function returned in the object provided by the API to start the WebSocket. Note: Failing to call the returned function with this option enabled will cause reload not to work. See return API for more information                                                        | ✓        | FALSE   |
| route                    | string  | Route that reload should use to serve the client side script file. Changing the route will require the script tag URL to change. Reload will always strip any occurrence of reload.js and append reload.js for you. This is to ensure case, order, and use of / is correct. For example specifying newRoutePath as the route will give reload a route of newRoutePath/reload.js. (Recommend not modifying). | ✓        | reload  |
| forceWss                 | boolean | Forces reload client connections to always use `wss` (secure websockerts) even when the window location is HTTP                                                                                                                                                                                                                                                                                             | ✓        | FALSE   |
| https                    | object  | HTTP options object. When defined runs reload in HTTPS mode                                                                                                                                                                                                                                                                                                                                                 | ✓        | {}      |
| https.certAndKey         | object  | Object that holds configuration for HTTPS key and cert configuration                                                                                                                                                                                                                                                                                                                                        | ✓        | {}      |
| https.certAndKey.key     | string  | File path to HTTP key (not optional when defining an HTTPS object)                                                                                                                                                                                                                                                                                                                                          |          | null    |
| https.certAndKey.cert    | string  | File path to HTTP cert (not optional when defining an HTTPS object)                                                                                                                                                                                                                                                                                                                                         |          | null    |
| https.p12                | object  | Object that holds configuration for HTTPS P12 configuration                                                                                                                                                                                                                                                                                                                                                 | ✓        | {}      |
| https.p12.p12Path        | string  | File path or file contents as string (Not optional when using P12 configuration                                                                                                                                                                                                                                                                                                                             |          | null    |
| https.passphrase         | string  |  Shared passphrase used for a single private key and/or p12.                                                                                                                                                                                                                                                                                                                                                                                              | ✓        | null    |
| verbose                  | boolean | If set to true, will show logging on the server and client side.                                                                                                                                                                                                                                                                                                                                            | ✓        | FALSE   |

#### Returns

An **object** containing:

| Name                 | Type     | Description                                                                                                                                                                                                          |
|----------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| reload               | function | A function that when called reloads all connected clients. For more information see manually firing server-side reload events.                                                                                       |
| startWebSocketServer | function | Returns a promise. Starts and opens the WebSocket server required for reload. Only **defined** when using the optional parameter `webSocketServerWaitStart`. Read the [parameters](#parameters) for more information |
| closeServer          | function | Returns a promise. Closes Reload WebSocket server                                                                                                                                                                    |
| wss                  | object   | Web socket server                                                                                                                                                                                                    |

Using reload as a command line application
---

There are two ways to use the command line application.

1. In a directory serving blank static HTML files or
2. In a project with a `package.json` file

Each will require different modes of installing.

In case one you should install reload globally with `npm install reload -g`. Also with reload installed globally you can go to any directory with an HTML file and use the command reload to constantly watch it and reload it while you make changes.

In case two you should install locally with `npm install --save-dev`, since this tool is to aid in development you should install it as a dev dependency.

Navigate to your html directory:

    reload -b

This will open your `index.html` file in the browser. Any changes that you make will now reload in the browser. You don't need to modify your HTML at all.

### Usage for Command Line Application

```
Usage: reload [options]

Options:
  -V, --version                  output the version number
  -b, --browser                  Open in the browser automatically.
  -n, --hostname [hostname]      If -b flag is being used, this allows for custom hostnames. Defaults to localhost.
  -d, --dir [dir]                The directory to serve up. Defaults to current dir.
  -w, --watch-dir [watch-dir]    The directory to watch. Defaults the serving directory.
  -i, --ignore [ignore]          Directories/files to ignore as a comma delimited list, glob supported. Default none
  -e, --exts [extensions]        Extensions separated by commas or pipes. Defaults to html,js,css.
  -p, --port [port]              The port to bind to. Can be set with PORT env variable as well. Defaults to 8080.
  -s, --start-page [start-page]  Specify a start page. Defaults to index.html
  -f, --fallback [fallback]      Fallback to the start page when route is not found
  -v, --verbose [verbose]        Turning on logging on the server and client side. Defaults to false
  -h, --help                     display help for command
```

License
---

[(MIT License)](LICENSE)

Copyright 2023

### Orginal Author:

JP Richardson  <jprichardson@gmail.com>

### Owned by:

Alexander J. Lallier <mralexlallier@gmail.com>
