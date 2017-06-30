var EventEmitter = require('events').EventEmitter
var util = require('util')
var parseUrl = require('url').parse
var parseQuerystring = require('querystring').parse

var namedParam = /:\w+/g
var splatParam = /\*\w+/g
var escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g
var namespaced = /^[\w\/:]+\|(\w+)$/

function Ramrod (routes) {
  this.routes = {}

  if (routes) {
    for (let path in routes) {
      if (routes.hasOwnProperty(path)) {
        const route = routes[path]
        if (toString.call(route) === '[object RegExp]') {
          this.routes[path] = route
        } else
        if (toString.call(route) === '[object Function]') {
          this.add(path, route)
        } else {
          this.add(path)
        }
      }
    }
  }
}

util.inherits(Ramrod, EventEmitter)

Ramrod.prototype.add = function (route, name, callback) {
  if (!callback && typeof name === 'function') {
    callback = name
  }
  if (!name || typeof name === 'function') {
    name = route
  }
  if (toString.call(route) !== '[object RegExp]') {
    route = this._routeToRegExp(route)
  }
  if (callback) {
    this.on(name, callback)
  }
  this.routes[name] = route
};

['get', 'post', 'put', 'del', 'options'].forEach(function (method) {
  var methodName = method === 'del' ? 'delete' : method

  Ramrod.prototype[method] = function (route, name, callback) {
    if (!callback && typeof name === 'function') {
      callback = name
    }
    if (!name || typeof name === 'function') {
      name = route
    }
    if (toString.call(route) !== '[object RegExp]') {
      route = this._routeToRegExp(route)
    }
    if (callback) {
      this.on(name + '|' + methodName, callback)
    }
    this.routes[name + '|' + methodName] = route
  }
})

Ramrod.prototype._routeToRegExp = function (route) {
  route = route.replace(escapeRegExp, '\\$&')
               .replace(namedParam, '([^\/]+)')
               .replace(splatParam, '(.*?)')
  return new RegExp('^\/' + route + '$')
}

function next () {}

Ramrod.prototype.dispatch = function (req, res) {
  var params, routeMethod
  var url = parseUrl(req.url)
  var method = req.method && req.method.toLowerCase()

  this.emit('before', req, res, next)

  for (var path in this.routes) {
    if ((params = this.routes[path].exec(url.pathname))) {
      var args = [ path, req, res ]

      if (params.length >= 1) {
        args = args.concat(params.slice(1))
      }

      if (url.query) {
        args.push(parseQuerystring(url.query))
      }

      routeMethod = namespaced.exec(path)

      if (routeMethod && routeMethod[1]) {
        if (routeMethod[1] === method) {
          return this.emit.apply(this, args)
        }
      } else {
        return this.emit.apply(this, args)
      }
    }
  }

  this.emit('*', req, res, next)
}

module.exports = function (routes) {
  return new Ramrod(routes)
}

module.exports.Ramrod = Ramrod
