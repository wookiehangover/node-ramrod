/*global describe, it, after, before, beforeEach*/
var ramrod = require('../index');
var assert = require('assert');

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
  });

});

