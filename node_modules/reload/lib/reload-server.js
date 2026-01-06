const http = require('http')
const reload = require('../lib/reload')
const fs = require('fs')
const path = require('path')
const open = require('open').default
const clc = require('cli-color')
const argv = require('minimist')(process.argv.slice(2))

const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')

const port = argv._[0]
const dir = argv._[1]
const openBrowser = (argv._[2] === 'true')
const hostname = argv._[3]
const runFile = argv._[4]
const startPage = argv._[5]
const fallback = (argv._[6] === 'true')
const verbose = (argv._[7] === 'true')

const reloadOpts = {
  verbose,
  noExpress: true
}

let time
let reloadReturned

const tryFiles = (...files) => {
  while (files.length > 0) {
    try {
      return fs.readFileSync(files.shift(), 'utf8')
    } catch (err) {
      // no-op
    }
  }
}

const serve = serveStatic(dir, { index: ['index.html', 'index.htm'] })

const server = http.createServer(function (req, res) {
  const pathname = decodeURIComponent(new URL(req.url, `http://${hostname}`).pathname)

  const ext = path.extname(pathname)
  const file = path.join(dir, pathname)

  // reload script
  if (pathname === '/reload/reload.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    return res.end(reloadReturned.reloadClientCode())
  }

  // static assets, not a .html or .htm or empty extension when auto serving `/` to index.html
  if (ext !== '.html' && ext !== '.htm' && ext !== '' && fs.existsSync(file)) {
    return serve(req, res, finalhandler(req, res))
  }

  // try html files
  const content = tryFiles(
    file,
    file + '.html',
    file + '.htm',
    file + 'index.html',
    file + 'index.htm',
    ...(fallback ? [path.join(dir, startPage)] : [])
  )

  if (content) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    return res.end(content + '\n\n<!-- Inserted by Reload -->\n<script src="/reload/reload.js"></script>\n<!-- End Reload -->\n')
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' })
  return res.end('File Not Found')
})

// Reload call and configurations. Stub app as it isn't used here
reload(function () {}, reloadOpts, server).then(function (reload) {
  reloadReturned = reload
  server.listen(port, function () {
    // Reload writes a random temp file which is checked on a reload so that the browser is not opened every time a change is made
    if (!fs.existsSync(runFile)) {
      fs.writeFileSync(runFile, '')

      // If openBrowser, open the browser with the given start page above, at a hostname (localhost default or specified).
      if (openBrowser) {
        open('http://' + hostname + ':' + port)
      }
    } else {
      time = new Date()
      console.log(clc.green('Server restarted  at ' + time.toTimeString().slice(0, 8)))
    }
  })
}).catch(function (err) {
  console.error('Could not start reload server', err)
  process.exit()
})
