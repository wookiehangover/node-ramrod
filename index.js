'use strict'

const { EventEmitter } = require('events')
const parseUrl = require('url').parse
const parseQuerystring = require('querystring').parse

const namedParam = /:\w+/g
const splatParam = /\*\w+/g
const escapeRegExp = /[-[\]{}()+?.,\\^$|#\s*]/g
const namespaced = /^[\w/:$\-_.+!*(),]+\|(\w+)$/

function routeToRegExp (route) {
  route = route.replace(escapeRegExp, '\\$&')
               .replace(namedParam, '([^/]+)')
               .replace(splatParam, '(.*?)')
  return new RegExp('^/' + route + '$')
}

function next () {}

class Router extends EventEmitter {
  constructor (routes) {
    super()
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

  add (route, name, callback) {
    if (!callback && typeof name === 'function') {
      callback = name
    }
    if (!name || typeof name === 'function') {
      name = route
    }
    if (toString.call(route) !== '[object RegExp]') {
      route = routeToRegExp(route)
    }
    if (callback) {
      this.on(name, callback)
    }
    this.routes[name] = route
  }

  dispatch (req, res) {
    let params
    let routeMethod
    const url = parseUrl(req.url)
    const method = req.method && req.method.toLowerCase()

    this.emit('before', req, res, next)

    for (const path in this.routes) {
      if ((params = this.routes[path].exec(url.pathname))) {
        let args = [ path, req, res ]

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
}

['get', 'post', 'put', 'del', 'options'].forEach(function (method) {
  const methodName = method === 'del' ? 'delete' : method

  Router.prototype[method] = function (route, name, callback) {
    if (!callback && typeof name === 'function') {
      callback = name
    }
    if (!name || typeof name === 'function') {
      name = route
    }
    if (toString.call(route) !== '[object RegExp]') {
      route = routeToRegExp(route)
    }
    if (callback) {
      this.on(name + '|' + methodName, callback)
    }
    this.routes[name + '|' + methodName] = route
  }
})

module.exports = function (routes) {
  return new Router(routes)
}

module.exports.Ramrod = Router
