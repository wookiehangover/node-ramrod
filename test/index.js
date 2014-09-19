/*global describe, it, after, before, beforeEach*/
var ramrod = require('../index');
var assert = require('assert');
var request = require('request');
var http = require('http');

describe('Router', function(){

  describe('constr', function(){
    it('should instantiate 2 ways', function(){
      assert.ok( ramrod() );
      assert.ok( new ramrod.Ramrod );
    });

    it('should take a routing table as an argument', function(){
      var router = ramrod({
        'foo/:bar': function( req, res ){}
      });

      assert.ok( router.routes['foo/:bar'] );
    });

    it('lets you make custom regex routes w/o an fn handler', function( done ){
      var router = ramrod({
        'foo': /^\/foo|bar$/
      });

      assert.ok( router.routes.foo );

      // lets have a little integration test just for shits
      var count = 0;

      router.on('foo', function( req ){
        count += 1;
        if( count === 2 ) done();
      });

      router.dispatch({ url: '/foo'});
      router.dispatch({ url: '/bar'});
    });

    it('if route value is not regex or function, this.add(key)', function () {
      var router = ramrod({
        'foo/:bar': null
      });

      assert.ok( router.routes['foo/:bar'] );
    });
  });

  describe('add', function(){
    beforeEach(function(){
      this.router = ramrod();
    });

    it('should add a route to the routes object', function(){
      this.router.add('foo/bar');
      assert.ok(this.router.routes['foo/bar']);
    });

    it('can add a named route', function(){
      this.router.add('foo/bar', 'foo');
      assert.ok(this.router.routes.foo);
    });

    it('will bind a callback if available', function( done ){
      this.router.add('foo/bar', 'foo', function(){ done(); });
      this.router.emit('foo');
    });

    it('will bind a callback even with an anonymous route', function( done ){
      this.router.add('foo/bar', function(){ done(); });
      this.router.emit('foo/bar');
    });

    it('allows regex routes', function(){
      this.router.add(/foo/, 'foo');
      assert.ok(this.router.routes.foo);
    });

    it('even lets you use anonymouse regex routes (like an idiot)', function(){
      this.router.add(/foo/);
      assert.ok(this.router.routes['/foo/']);
    });

    it('matches empty routes to /', function( done ){
      this.router.add('', function(){ done(); });
      this.router.emit('');
    });
  });

  describe('dispatch', function(){
    beforeEach(function(){
      this.router = ramrod();
    });

    it('should match on an existing route', function( done ){
      this.router.add('foo', function( req, res ){
        done();
      });

      this.router.dispatch({ url: '/foo' });

    });

    it('should fire a `before` event', function( done ){
      this.router.on('before', function(){
        done();
      });

      this.router.dispatch({ url: '' });
    });

    it('should fire * when no route matches', function( done ){
      this.router.on('*', function(){
        done();
      });

      this.router.dispatch({ url: '/foo' });
    });

    it('should mock a next() method for middleware compatability', function( done ){
      this.router.on('before', function(req, res, next){
        next();
        done();
      });

      this.router.dispatch({ url: '' });
    });

    it('should pass req and res to the handler', function( done ){
      this.router.on('*', function( req, res ){
        assert.equal( req.url, '/foo' );
        assert.ok( res );
        done();
      });

      this.router.dispatch({ url: '/foo'}, {});
    });

    it('should pass route params as arguments', function( done ){
      this.router.add('foo/:bar/:biz', function( req, res, bar, biz ){
        assert.equal( bar, 'hotdog');
        assert.equal( biz, 'cats');
        done();
      });

      this.router.dispatch({ url: '/foo/hotdog/cats' }, null);
    });

    it('should pass the url\'s querystring to the route handler', function(done){
      this.router.add('foo/bar', function( req, res, qs ){
        assert.equal( 'baz', qs.biz );
        done();
      });

      this.router.dispatch({ url: '/foo/bar?biz=baz' }, null);
    });
  });

});

describe('Integration', function(){
  var router = ramrod();

  var server = http.createServer(function(req, res){
    router.dispatch(req,res);
  });

  before(function(done){
    server.listen(9999, done);
  });

  after(function(){
    server.close();
  });

  router.on('*', function(req, res){
    res.writeHead(404);
    res.end('Not Found');
  });

  it('should 404', function(done){
    request.get('http://localhost:9999/afdahfjdsk', function(err, res, body){
      assert.equal(res.statusCode, 404);
      assert.equal(body, 'Not Found');
      done();
    });
  });

  ['get','post','put','del'].forEach(function(method){
    router[method]('foo/bar/baz', function(req, res){
      res.writeHead(200);
      res.end(method);
    });

    router[method]('foo/bar/:biz', function(req, res, biz){
      res.writeHead(418);
      res.end(biz + method);
    });

    it('router#'+ method, function(done){
      request[method]('http://localhost:9999/foo/bar/baz', function(err, res, body){
        assert.equal(res.statusCode, 200);
        assert.equal(body, method);
        done();
      });
    });

    it('router#'+ method, function(done){
      request[method]('http://localhost:9999/foo/bar/some', function(err, res, body){
        assert.equal(res.statusCode, 418);
        assert.equal(body, 'some'+ method);
        done();
      });
    });

  });

  // RFC1738 defines the following characters as valid unencoded characters in a url.
  // http://www.faqs.org/rfcs/rfc1738.html
  '$-_.+!*(),'.split('').forEach(function(character){
    router.post('path/with/char'+character, function(req, res){
      res.writeHead(405);
      res.end('Not Allowed');
    });

    router.get('path/with/char'+character, function(req, res){
      res.writeHead(200);
      res.end('char'+character);
    });

    it('router#'+character, function(done){
      request.get('http://localhost:9999/path/with/char'+character, function(err, res, body){
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'char'+character);
        done();
      });
    });
  });

});

