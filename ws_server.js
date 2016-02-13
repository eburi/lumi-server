'use strict';

var io = require('socket.io').listen(3001);
var lumi = require('./lumi/lumi');

var conf = require('./lumi/config')();

var spiDevice = process.env.SPI_DEVICE || conf.device;
console.log('Using device: ' + spiDevice);
lumi.openPort(spiDevice);

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

    // socket.on('runSketch', function(data) {
    //     var name = data.name;
    //     sketchRunner.runSketch(name, 'http://localhost:'+(process.env.PORT || 3000)+'/play/'+name);
    // });
    // socket.on('stopSketch', function(data) {
    //     var id = data.id;
    //     sketchRunner.stopSketchById(id);
    // });
    //
    // socket.on('stopSketchNamed', function(data) {
    //     var name = data.name;
    //     sketchRunner.stopSketchById(name);
    // });
    //
    // socket.on('stopAllSketch',function(){
    //     sketchRunner.stopAll();
    // });
});

// sketchRunner.addListener(function(name,state, id){
//     console.log('SKETCH_RUNNER: id:' + id + ' name:' + name + ' state:'+state);
//     io.sockets.emit('rskstate', { name: name, state: state, id: id });
// });
