
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var util = require('util');

var lumi = require('./lumi.js');

var fpsc_startTime = Date.now();
var fpsc_framesCounter = 0;

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

io.on('connection', function (socket) {
  socket.on('frame', function(data) {
    lumi.frame(data.data, socket.id);

    /*DEBUG*/if (Date.now() - fpsc_startTime > 1000) {
    /*DEBUG*/  console.log(socket.id, Date.now(),"client-fps: " + fpsc_framesCounter);
    /*DEBUG*/  fpsc_framesCounter = 0;
    /*DEBUG*/  fpsc_startTime = Date.now();
    /*DEBUG*/}
    /*DEBUG*/fpsc_framesCounter++;

  });

	socket.on('reset', function(data)  {
		lumi.reset(socket.id);
	});

  socket.on('iframe', function(data) {
    lumi.indexed_frame(data.data, socket.id);
  });

	socket.on('palette', function(data) {
		lumi.set_palette(data.data, socket.id);
	});

	socket.on('createDistPal', function(data) {
    lumi.set_dist_palette(data.data, socket.id);
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

var lumiDevice = process.env.LUMI_DEVICE || "/dev/lumi"
console.log("Using device: " + lumiDevice);
lumi.open_port(lumiDevice);

// Routes

//app.get('/', routes.index);
app.get('/', function(req, res){
  res.redirect('/index.html');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
