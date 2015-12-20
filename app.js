'use strict';

/**
 * Module dependencies.
 */

var conf = require('./lib/config')();
var app = require('express')();
var http = require('http').Server(app);
var sketches = require('./routes/sketches');
var sketchRunner = require('./lib/sketch_runner');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var morgan  = require('morgan');
var methodOverride = require('method-override');
var serveStatic = require('serve-static');
var errorhandler = require('errorhandler');

// var lumiSocket = require('');

var lumi = require('./lib/lumi');
var io = require('socket.io')(http);
io.on('connection', function (socket) {
    // var fpscStartTime = Date.now();
    // var fpscFramesCounter = 0;

    socket.on('frame', function(data) {
        lumi.frame(data.data, socket.id);

        // if (Date.now() - fpscStartTime > 1000) {
        //     console.log('last clientID: ' + socket.id);
        //     console.log(socket.id, Date.now(),'client-fps: ' + fpscFramesCounter);
        //     fpscFramesCounter = 0;
        //     fpscStartTime = Date.now();
        // }
        // fpscFramesCounter++;
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
        sketchRunner.runSketch(name, 'http://localhost:'+(process.env.PORT || 3000)+'/play/'+name);
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

var spiDevice = process.env.SPI_DEVICE || conf.device;
console.log('Using device: ' + spiDevice);
lumi.openPort(spiDevice);

sketchRunner.addListener(function(name,state, id){
    console.log('SKETCH_RUNNER: id:' + id + ' name:' + name + ' state:'+state);
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


//Routes
app.get('/', sketches.get);
app.get('/sketches', sketches.list(sketchRunner));
app.get('/sketches/:name', sketches.get);
app.delete('/sketches/:name', sketches.delete);
app.get('/remotes', sketches.remotes(sketchRunner));
app.get('/play/:name',sketches.play);
//upsert
app.post('/sketches', sketches.upsert);

http.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
