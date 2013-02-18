var serialport = require('serialport');
var util = require('util');
var fs = require('fs');

var WIDTH = 32;
var HEIGHT = 32;

var serialPortName = null;
var port = null;
var portReady = false;
var palette = null;

function open(portName) {
	serialPortName = portName;
	if( port != null ) {
		port.close();
		port = null;
	}

	port = new serialport.SerialPort(portName, { baudrate: 115200, parser: serialport.parsers.readline("\n") });
  port.on("open", function() {
    console.log("port to lumi opened on: " + serialPortName);
    portReady = true;
  });

  port.on("close", function() {
    portReady = false;
  });

	port.on("data", function(data) {
		///*DEBUG*/console.log("lumi says: " + data);
	});
  port.on('error', function(err) {
    ///*DEBUG*/console.log("error from the port:",err);
    portReady = false;
  });
}

function sendFrame(data) {
  if(!(data instanceof Buffer) || data.length != WIDTH*HEIGHT*3) {
		console.log("sendFrame: Called with a frame I can't process. Size: " + data.length);
    return;
	}
	var frame = data;
  if(portReady) {
    port.write(frame);
  } else {
    open(serialPortName);
  }
}

function reset() {
	var buffer = new Buffer(WIDTH * HEIGHT*3);
	setColor(buffer, 0,0,0);
  sendFrame(buffer);
}

function setColor(buf, r,g,b) {
	for(var y=0; y < HEIGHT; y++) {
		for(var x=0; x < WIDTH; x++) {
			var pos = (y*WIDTH + x) * 3;
			buf[pos + 0] = r; // R
			buf[pos + 1] = g; // G
			buf[pos + 2] = b; // B
		}
	}
}

exports.openPort = open;
exports.sendFrame = sendFrame;
exports.reset = reset;
exports.setColor = setColor;

// Test-Code
/*
   open("/dev/lumi");

   var buffer = new Buffer(WIDTH * HEIGHT);
   var fullBuffer = new Buffer(WIDTH * HEIGHT * 3);
   var DELAY = 1000/25;


   function fixColor() {
   setColor(fullBuffer, 0xff, 0, 0);

   console.log(fullBuffer);
   sendFrame(fullBuffer);

// Loop, kind of...
setTimeout(fixColor, DELAY);
}


for(var i=0; i<buffer.length; i++) {
buffer[i] = parseInt(Math.random()*(512/colors.length) / 2);
}

function changeColor() {
for(var i=0; i<buffer.length; i++) {
var v = buffer[i];
if(v % 2 == 0) {
if(v < 0xFE )
v += 2;
else
v = 0xFF;
} else {
if(v > 2)
v -= 2;
else
v = 0;
}
buffer[i] = v;
}
sendFrame(buffer);
// Loop, kind of...
setTimeout(changeColor, DELAY);
}
setTimeout(changeColor, DELAY);
 */
