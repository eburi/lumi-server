var lumi_serial = require('./lumi_serial.js');
var util = require('util');

var WIDTH = 32;
var HEIGHT = 32;

// Maps for frames to eventually calculate the 'combined' frame
var framesByClientId = {};

var iframesByClientId = {};
var paletteDefinitionsByClientId = {};

exports.frame = function(data, clientId) {
  if(data.length !=  WIDTH * HEIGHT * 3) {
    console.log("client ", clientId, "sends bogous frame", data);
    return;
  }
  framesByClientId[clientId] = new Buffer(data);
};

exports.reset = function(clientId) {
  delete framesByClientId[clientId];
  delete iframesByClientId[clientId];

  if(framesByClientId.length == 0 && iframesByClientId.length == 0) {
    // nobody sent frames for this frame
    lumi_serial.reset();
  }
};

exports.set_palette = function(data,clientId) {
  palettesByClientId[clientId] = data;
};

exports.set_dist_palette = function(data,clientId) {
  exports.setPalette(createPaletteDefinition(data), clientId);
};

exports.indexed_frame = function(data,clientId) {
  var paletteDefinition = paletteDefinitionsByClientId[clientId];
  var frame = expandFrame(data, paletteDefinitionsByClientId[clientId]);
  framesByClientId[id] = frame;
};

exports.open_port = function(port) {
  lumi_serial.openPort(port);
};

//-----------------------------------------------------------------
// Palette-Functions
//-----------------------------------------------------------------
var palette = null;
function expandFrame(frame, palette) {
	var frame = new Buffer(WIDTH * HEIGHT * 3);

  // check to be sure - This is the fishy TODO from below...
  setPalette(palette);
  if(palette == null) {
		console.log("sendFrame: Missing palette - skipped frame");
		return null;
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
  return frame;
}


//TODO TODO - Here is something fishy...
// why do we need a palette to be complete(0..255)??
// Just remeber the given colors when expanding and set anything above palette.length
// to be [0,0,0]
function setPalette(pal) {
	if( ! pal instanceof Array)	{
		console.log("setPalette: argument must be an array of array");
		return;
	}

	for(var i=0; i<pal.length; i++) {
		if( ! pal[i] instanceof Array || pal[i].length != 3) {
			console.log("setPalette: argument must be an array of arrays of size 3. [[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]]");
			return;
		}
	}
	console.log("setPalette: setting a new palette with " + pal.length + " colors");

	var newPalette = [];
	for(var i=0; i<256; i++) {
		var buf = new Buffer(3);
		if(i<pal.length) {
			// take the color from the palette
			buf[0] = pal[i][0];
			buf[1] = pal[i][1];
			buf[2] = pal[i][2];
		} else {
			// put black
			buf[0] = buf[1] = buf[2] = 0x00;
		}
		newPalette[i] = buf;
	}
	palette = newPalette;
}

/* Creates a palatte by equaly distributing the colors give */
/* colors is an array of the form [[R,G,B],[R,G,B]] */
function createPaletteDefinition(colors) {

	if(colors == null || colors.lenght == 0)
		return;

	var newPalette = [];
	var nbrColors = colors.length;
	var stepSize = 256 / nbrColors;
	for(var i=0; i<256; i++) {
		var idx = Math.floor(i / stepSize);
		var buf = [];
		buf[0] = colors[idx][0];
		buf[1] = colors[idx][1];
		buf[2] = colors[idx][2];
		newPalette[i] = buf;
	}
	return newPalette;
}

//var colors = [[234,140,177],[93,121,135],[252,196,159],[168,212,199]];
//var colors = [[ ],[ ],[ ],[ ]];
//var colors = [[17,118,109 ],[65,9,54 ],[164,11,84 ],[228,111,10 ], [240,179,0]];
var colors = [[0xFF,0,0 ],[0,0xFF,0 ],[0,0,0xFF ]];
setPalette(colors);


//-----------------------------------------------------------------
// Frame Mixer
// simple MAX-Mixer, inplace with fA
function mixFrame(fA,fB) {
  for( var i=0; i<fA.length; i++ ) {
    fA[i] = Math.max(fA[i], fB[i]);
  }
  return fA;
}

//-----------------------------------------------------------------
// Lumi-Updater with fixed FrameRate
var SERVER_FRAMERATE = 30;
var cp_startTime = Date.now();

function updateLumi() {
  var finalFrame = new Buffer(WIDTH * HEIGHT * 3);
  // clean buffer
  for( var i=0; i<finalFrame.length; i++) {
    finalFrame[i]=0;
  }

  // Reduce frames to one - mix all frames into the finalFrame
  for( cId in framesByClientId) {
    finalFrame = mixFrame(finalFrame, framesByClientId[cId]);
  }

  /*DEBUG*/if (Date.now() - cp_startTime > 1000) {
    /*DEBUG*/console.log(new Date().toISOString() + " client-count: " + Object.keys(framesByClientId).length);
    /*DEBUG*/cp_startTime = Date.now();
  /*DEBUG*/}

  lumi_serial.sendFrame(finalFrame);
}
setInterval(updateLumi, 1000 / SERVER_FRAMERATE)
