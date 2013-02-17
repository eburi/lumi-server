
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var util = require('util');

var lumi = require('./lumi_serial.js');

var started = Date.now();
var frames = 0;

io.configure('production', function(){
  io.enable('browser client etag');
  io.set('log level', 1);

  io.set('heartbeats', false);

  io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);
});

io.configure('development', function(){
  io.set('transports', ['websocket']);
});

io.sockets.on('connection', function (socket) {
  socket.on('frame', function(data) {

    var frame = new Buffer(data.data); 
    lumi.sendFrame(frame);

    ///*DEBUG*/if (Date.now() - started > 1000) {
    ///*DEBUG*/  console.log(Date.now() + " - fps: " + frames);
    ///*DEBUG*/  frames = 0;
    ///*DEBUG*/  started = Date.now(); 
    ///*DEBUG*/}
    ///*DEBUG*/frames++;

  });
	
	socket.on('reset', function(data)  {
		lumi.reset();
	});

  socket.on('iframe', function(data) {
    var frame = new Buffer(data.data); 
    lumi.sendFrame(frame);
  });

	socket.on('palette', function(data) {
		lumi.setPalette(data.data);
	});

	socket.on('createDistPal', function(data) {
		var pal = lumi.createPalette(data.data);
		lumi.setPalette(pal);
	});
});


// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

lumi.openPort('/dev/lumi');

// Routes

//app.get('/', routes.index);
app.get('/', function(req, res){
  res.redirect('/index.html');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
