var serialport = require('serialport');
var util = require('util');
var fs = require('fs');

var WIDTH = 32;
var HEIGHT = 32;

var serialPortName = null;
var port = null;
var palette = null;

function open(portName) {
	serialPortName = portName;
	if( port != null ) {
		port.close();
		port = null;
	}
	try {
		port = new serialport.SerialPort(portName, {baudrate: 115200,parser: serialport.parsers.readline("\n")});
		port.on("data", function(data) {
				///*DEBUG*/console.log("lumi says: " + data);
				});
	} catch(ex) {
		console.log("opening port '" + portName + "' failed: " + ex);
		port = null;
	}	
}

function sendFrame(data) {
	var frame = new Buffer(WIDTH * HEIGHT * 3);
	if(data.length == WIDTH*HEIGHT*3) {
		// full frame (R,G,B) => convert G,R,B
		for(var y=0; y < HEIGHT; y++) {
			for(var x=0; x < WIDTH; x++) {			
				var pos = (y * WIDTH + x) * 3;
				frame = data;
				//frame[pos    ] = data[pos    ]; // R
				//frame[pos + 1] = data[pos + 1]; // G
				//frame[pos + 2] = data[pos + 2]; // B
			}
		}
	} else if(data.length == WIDTH * HEIGHT) {
		// indexed frame
		if(palette == null) { 
			console.log("sendFrame: Missing palette - skipped frame");
			return;
		}
		for(var y=0; y < HEIGHT; y++) {
			for(var x=0; x < WIDTH; x++) {			
				var pos = (y * WIDTH + x);
				var fPos = pos * 3;
				var color = palette[ data[pos] ];
				frame[fPos    ] = color[0]; // R
				frame[fPos + 1] = color[1]; // G
				frame[fPos + 2] = color[2]; // B
			}
		}
	} else {
		console.log("sendFrame: Called with a frame I can't process. Size: " + data.length);
		return;
	}

	if(port != null) {
		port.write(frame);
		// check if port is still valid 
		fs.stat(serialPortName, function(err,stats) { 
			if(err) {
				console.log("Failed to stat lumi-port "+serialPortName + ": " + err);
				port = null;
			/*}else {
				console.log("stats: " + util.inspect(stats));
				if(stats.isCharacterDevice()) {
					console.log("It's not a char-device...");
				}
			*/
			}
		});
	} else {
		open(serialPortName);
		if(port != null) {
			port.write(frame);
		} else {
			console.log("sendFrame: Can't send frame, cause port " + serialPortName + "  is not open yet and trying to open it failed...");	
		}
	}
}

function setColor(buf, r,g,b) {
	for(var y=0; y < HEIGHT; y++) {
		for(var x=0; x < WIDTH; x++) {
			var pos = (y*WIDTH + x) * 3;
			buf[pos + 0] = r; // G
			buf[pos + 1] = g; // R
			buf[pos + 2] = b; // B
		}
	}
}

/* colors is an array of the form [[R,G,B],[R,G,B]] */
function setPalette(colors) {

	if(colors == null || colors.lenght == 0) 
		return;

	var newPalette = [];	
	var nbrColors = colors.length;
	var stepSize = 256 / nbrColors;
	for(var i=0; i<256; i++) {
		var idx = Math.floor(i / stepSize);
		var buf = new Buffer(3);
		buf[0] = colors[idx][0];
		buf[1] = colors[idx][1];
		buf[2] = colors[idx][2];
		newPalette[i] = buf;
	}
	palette = newPalette;
}

//var colors = [[234,140,177],[93,121,135],[252,196,159],[168,212,199]];
//var colors = [[ ],[ ],[ ],[ ]];
//var colors = [[17,118,109 ],[65,9,54 ],[164,11,84 ],[228,111,10 ], [240,179,0]];
var colors = [[0xFF,0,0 ],[0,0xFF,0 ],[0,0,0xFF ]];
setPalette(colors);


exports.openPort = open;
exports.sendFrame = sendFrame;
exports.setColor = setColor;
exports.setPalette = setPalette;

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

