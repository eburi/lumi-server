
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
	, sketches = require('./routes/sketches')
	, conf = require('./lib/config')()
  , app = express()
	, server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , util = require('util')
  , lumi = require('./lib/lumi');

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
  io.set('log level', 1);
  io.set('transports', ['websocket']);
});

io.on('connection', function (socket) {
  var fpsc_startTime = Date.now();
  var fpsc_framesCounter = 0;

  socket.on('frame', function(data) {
    lumi.frame(data.data, socket.id);

    if (Date.now() - fpsc_startTime > 1000) {
      console.log(socket.id, Date.now(),"client-fps: " + fpsc_framesCounter);
      fpsc_framesCounter = 0;
      fpsc_startTime = Date.now();
    }
    fpsc_framesCounter++;

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

  socket.on('disconnect', function(){
    lumi.reset(socket.id);
  });
});



// Configuration
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: false});
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

console.log("Using device: " + conf.device);
lumi.open_port(conf.device);

// Routes
app.get('/sketches', sketches.list);
app.post('/sketches', sketches.upsert);

app.get('/', function(req, res){
  res.redirect('/index.html');
});

server.listen(app.get('port'), function(){
   console.log("Express server listening on port " + app.get('port'));
});
