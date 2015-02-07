'use strict';

/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , sketches = require('./routes/sketches')
  , conf = require('./lib/config')()
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , lumi = require('./lib/lumi')
  , sketchRunner = require('./lib/sketch_runner')
  , bodyParser = require('body-parser')
  , favicon = require('serve-favicon')
  , morgan  = require('morgan')
  , methodOverride = require('method-override')
  , serveStatic = require('serve-static')
  , errorhandler = require('errorhandler')
  ;

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
    var fpscStartTime = Date.now();
    var fpscFramesCounter = 0;

    socket.on('frame', function(data) {
        lumi.frame(data.data, socket.id);

        if (Date.now() - fpscStartTime > 1000) {
            console.log(socket.id, Date.now(),'client-fps: ' + fpscFramesCounter);
            fpscFramesCounter = 0;
            fpscStartTime = Date.now();
        }
        fpscFramesCounter++;

    });

    socket.on('reset', function()  {
        lumi.reset(socket.id);
    });

    socket.on('iframe', function(data) {
        lumi.indexedFrame(data.data, socket.id);
    });

    socket.on('palette', function(data) {
        lumi.setPalette(data.data, socket.id);
    });

    socket.on('createDistPal', function(data) {
        lumi.setDistPalette(data.data, socket.id);
    });

    socket.on('disconnect', function(){
        lumi.reset(socket.id);
    });

    socket.on('runSketch', function(data) {
        var name = data.name;
        sketchRunner.runSketch(name, "http://localhost:"+(process.env.PORT || 3000)+"/play/"+name);
    });

    socket.on('stopSketch', function(data) {
        var id = data.id;
        sketchRunner.stopSketchById(id);
    });

    socket.on('stopSketchNamed', function(data) {
        var name = data.name;
        sketchRunner.stopSketchById(name);
    });

    socket.on('stopAllSketch',function(){
        sketchRunner.stopAll();
    });
});

sketchRunner.addListener(function(name,state, id){
    console.log("SKETCH_RUNNER: id:" + id + " name:" + name + " state:"+state);
    io.sockets.emit('rskstate', { name: name, state: state, id: id });
});


// Configuration
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.set('view options', {layout: false});
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan({ format: 'dev', immediate: true }));
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(serveStatic('public/'));
app.use(errorhandler());

console.log("Using device: " + conf.device);
lumi.openPort(conf.device);

//Routes
app.get('/', sketches.get);
app.get('/sketches', sketches.list(sketchRunner));
app.get('/sketches/:name', sketches.get);
app.delete('/sketches/:name', sketches.delete);
app.get('/remotes', sketches.remotes(sketchRunner));
app.get('/play/:name',sketches.play);
//upsert
app.post('/sketches', sketches.upsert);

server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
