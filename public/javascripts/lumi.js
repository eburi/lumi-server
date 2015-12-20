/* the exposed lumi-object */
var lumi = function(){
	var WIDTH = 32;
	var HEIGHT = 32;
	var FULL_FRAME_SIZE = WIDTH*HEIGHT*3;
	var INDEXED_FRAME_SIZE = WIDTH*HEIGHT;
	var stateListeners = [];

	if(typeof io != 'undefined'){
		var socket = io.connect();
	} else {
		return false;
	}

	/*
	  Send a frame to lumi.

	  Input:
	  frame - an array of size WIDHT*HEIGHT * 3 with byte values (RGB) e.g [R1,G1,B1,R2,G2,B2... R1024,G1024,B1024].
  */
	var sendFrame = function(frame) {
		if(frame.length != FULL_FRAME_SIZE) {
			console.log("Frame has the wrong size: " + frame.length + " Expected: " + FULL_FRAME_SIZE);
			return;
		}
		socket.emit('frame', { data: frame });
	};

	/*
	  Resets lumi to all black ie all LEDs off
	*/
	var reset = function() {
		socket.emit('reset');
	};

	/*
	  Send an indexed frame to lumi.

    An indexed frame is a frame with only one byte per pixel that serves as
	  an index into the the current palette set using setPalette() or createDistPalette().

	  The intention is to reduce the amount of data that needs to be sent per frame.

    Input:
	  frame - an array of byte of the size WIDTH*HEIGHT and each byte represents the color-number in the palette currently set.
	*/
	var sendIndexedFrame = function(iframe) {
		if(iframe.length != INDEXED_FRAME_SIZE) {
			console.log("Indexed Frame has wrong size: " + iframe.length + " Expected: " + INDEXED_FRAME_SIZE);
			return;
		}
		socket.emit('iframe', { data: iframe });
	};

	/*
	  Set the lumi palette.

	  A palette is an array of colors ([[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]]). At max. there
	  can be 256 colors in one palette. Once a palette has been set, one can send indexed
	  frames that will be resolved to full frames using this palette.

	  If the palette does not contain 256 colors, the rest of the colors will be set to black.
	  See createDistPalette() if you want to create a complete palette with only a few colors.

	  The intention is to reduce the amount of data that needs to be sent per frame.

	  Input:
	  palette - An array with colors in the form: [[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]...[RX,GX,BX]] (X max is 256).
	*/
	var setPalette = function(palette) {
		if( ! palette instanceof Array  || palette.length > 256)	{
			console.log("setPalette: argument must be an array of array with max. size 256");
			return;
		}

		for(var i=0; i<palette.length; i++) {
			if( ! palette[i] instanceof Array || palette[i].length != 3) {
				console.log("setPalette: argument must be an array of arrays of size 3. [[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]]");
				return;
			}
		}
		// we have a valid palette
		socket.emit('palette', { data: palette });
	};

	/*
	  Create a palette from a given number of colors.
	  From the given number of colors, lumi will create an equally spaced, full palette.
	  E.g. if the given palette contains three colors, color value 0-88 will result in the first Color,
    color value 89-176 will result in the second Color and color value 177-255 will result in third Color.

	  Compared to setPalette(), this function will not fill up the palette with 'black', but distribute the
	  given color over the complete palette space.

	  Input:
	  palette - An array with colors in the form: [[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]...[RX,GX,BX]] (X max is 256).
	*/
	var createDistPalette = function(palette) {
		if( ! palette instanceof Array || palette.length > 256)	{
			console.log("createDistPalette: argument must be an array of array with max. size 256");
			return;
		}

		for(var i=0; i<palette.length; i++) {
			if( ! palette[i] instanceof Array || palette[i].length != 3) {
				console.log("createDistPalette: argument must be an array of arrays of size 3. [[R1,G1,B1],[R2,G2,B2],[R3,G3,B3]]");
				return;
			}
		}
		// we have a valid palette
		socket.emit('createDistPal', { data: palette });
	}

	var state = 0;
	var count = 10;
	var test = function() {
		var frame = [];
		for(var i=0; i<FULL_FRAME_SIZE; i++) {
			frame[i] = state == 0? 0xFF : 0x00;
		}
		state = state == 0? 1 : 0;
		sendFrame(frame);
		if( count-- > 0 ) {
			setTimeout(test, 1000);
		} else {
			count = 10;
		}
	};

  /* run a remote-sketch */
  var runRemote = function(name){
    socket.emit('runSketch', { name: name });
  };

  /* stop remote-sketches */
  var stopRemoteById = function(id) {
    socket.emit('stopSketch', { id: id });
  };

  var stopRemoteByName = function(name) {
    socket.emit('stopSketchNamed', { name: name });
  };

  var stopRemoteAll = function() {
    socket.emit('stopAllSketch');
  };

  /* remote-state-listener */
  var listenRemoteSketch = function(cb) {
    stateListeners.push(cb);
  };

  socket.on('rskstate', function (data) {
    var name  = data.name
    ,   state = data.state
    ,   id    = data.id
    ;

    console.log("received state-update ",data);
    stateListeners.forEach(function(e){
      e(name,state,id);
    });

  });

	/* export functions */
	return {
		sendFrame: sendFrame,
		reset: reset,
		sendIndexedFrame: sendIndexedFrame,
		setPalette: setPalette,
		createDistPalette: createDistPalette,
    listenRemoteSketch: listenRemoteSketch,
    runRemote: runRemote,
    stopRemoteById: stopRemoteById,
    stopRemoteByName: stopRemoteByName,
    stopRemoteAll: stopRemoteAll,

		test: test
	}
}();
