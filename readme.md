# Ramrod

[![Build Status](https://secure.travis-ci.org/wookiehangover/node-ramrod.png?branch=master)](http://travis-ci.org/wookiehangover/node-ramrod)

An extremely minimal router. Seriously, it's pretty much just an
EventEmitter (but that's a good thing.) It's the router you'd write if
you were writing a router.

## Usage

Add to your project with `npm install ramrod --add` and include it in
your node app. It's meant to be used with the `http` module. Here's what
it looks like in action:

    var http
    var ramrod = require('ramrod');
    var router = ramrod();

    router.add('my/:route', function(req, res, param ){
      res.writeHead(200);
      res.end('Hello '+ param +'\n');
    });

    router.on('*', function(req, res){
      res.writeHead(200);
      res.end('All other urls go here :)\n');
    });

    http.createServer(function(req, res){
      router.dispatch(req, res);
    }).listen(3000);


### ramrod([routes])

Returns a Ramrod instance and takes an optional routes object as it's
only argument.

The routes object takes the form:

    {
      'route/:param1/:param2': function( req, res, p1, p2){
        // route handler
      },

      'namedRegExpRoute': /^custom\/(reg|ex)/
    }

Routes can be processed as either route/handler pairs or as named
Regular Expression routes.

### ramrod.add(route, [name], [callback])

Route strings can contain `:params` and `*splats` that are passed to the
route's callback when matched.

Named routes can be useful for aliasing a complex route string. If the 
`name` is present, the route will be given that event name. E.g.:

    router.add('foo/:bar', foo); // router will emit a 'foo' event

If a funtion is passed as the last argument, it will be used as the
handler for the route being added. The callback is always passed the
`http.ClientRequest` and `http.ClientResponse` objects as its first 2
arguments.

    router.on('foo', function( req, res ){ ... });

### ramrod.on(event, callback)

*Inhereted from EventEmitter*

Callbacks recieve all the same arguments as when attached with `add`.

### ramrod.dipatch(request, response)

Processes a request and a response object, emitting the first matched
route from the `ramrod.routes` object. If no matching routes are found,
the '\*' event is emitted.
