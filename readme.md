# Ramrod

An extremely minimal router. Seriously, its pretty much just an
EventEmitter (but that's a good thing.) Its the router you'd write if
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
