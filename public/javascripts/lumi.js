var lumi = function(){
	var WIDTH = 32;
	var HEIGHT = 32;
	var FULL_FRAME_SIZE = WIDTH*HEIGHT*3;
	var INDEXED_FRAME_SIZE = WIDTH*HEIGHT;


  // TODO: find host...
	var socket = io.connect('http://192.168.1.35');

	sendFrame = function(frame) {
		if(frame.length != FULL_FRAME_SIZE) {
			console.log("Frame has the wrong size: " + frame.length + " Expected: " + FULL_FRAME_SIZE);
			return;
		}
		socket.emit('frame', { data: frame });	
	};

	sendIndexedFrame = function(iframe) {
		if(iframe.length != INDEXED_FRAME_SIZE) {
			console.log("Indexed Frame has wrong size: " + iframe.length + " Expected: " + INDEXED_FRAME_SIZE);
			return;
		}
		socke.emit('iframe', { data: iframe });
	};
	
	setPalette = function(palette) {
			
	};

	var state = 0;
	var count = 10;
	test = function() {
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

	return {
		sendFrame: sendFrame,
		sendIndexedFrame: sendIndexedFrame,
		setPalette: setPalette,
		test: test
	}
}();

