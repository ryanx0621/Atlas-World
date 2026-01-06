module.exports = function (app, opts) {
  const reload = require('./lib/reload')

  return reload(app, opts)
}
