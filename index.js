var EventEmitter = require('events').EventEmitter;
var util = require('util');
var parseUrl = require('url').parse;
var parseQuerystring = require('querystring').parse;

var namedParam    = /:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;

function Ramrod( routes ){
  this.routes = {};

  if( routes ){
    for(var path in routes ){
      if( routes.hasOwnProperty( path ) ){

        if( util.isRegExp( routes[path] ) ){
          this.routes[path] = routes[path];

        } else if( typeof routes[path] == "function" ){
          this.add( path, routes[path] );

        } else {
          this.add( path );
        }

      }
    }
  }
}

util.inherits(Ramrod, EventEmitter);

Ramrod.prototype.add = function( route, name, callback ){
  if( !callback && typeof name == "function") {
    callback = name;
  }

  if( !name || typeof name == "function" ) {
    name = route;
  }

  if( !util.isRegExp(route) ){
    route = this._routeToRegExp( route );
  }

  if( callback ){
    this.on(name, callback);
  }

  this.routes[name] = route;
};

Ramrod.prototype._routeToRegExp = function(route) {
  route = route.replace(escapeRegExp, '\\$&')
               .replace(namedParam, '([^\/]+)')
               .replace(splatParam, '(.*?)');
  return new RegExp('^\/' + route + '$');
};

function next(){}

Ramrod.prototype.dispatch = function( req, res ){
  var params;
  var url = parseUrl(req.url);

  this.emit('before', req, res, next);

  for(var path in this.routes){
    if( (params = this.routes[path].exec( url.pathname )) ){
      var args = [ path, req, res ];

      if( params.length >= 1 ){
        args = args.concat( params.slice(1) );
      }

      if( url.query ){
        args.push( parseQuerystring( url.query ) );
      }

      return this.emit.apply(this, args );
    }
  }

  this.emit('*', req, res, next);
};

module.exports = function( routes ){
  return new Ramrod( routes );
};

module.exports.Ramrod = Ramrod;
