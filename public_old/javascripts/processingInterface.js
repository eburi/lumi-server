
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

var canvasId = 'simCanvas'
  , simDiv
  , canvasParent
  , simMask
  , lumiWidth = 32
  , lumiHeight = 32
  , maskWidth = 320
  , maskHeight = 320
;

function resizeSim() {
  simDiv.height(simDiv.width());

  maskWidth = simMask.width();
  maskHeight = simMask.height();
}

$(document).ready(function () {
  simDiv = canvasParent = $('#sim');
  simMask = $('#simMask');

  resizeSim();

  initSimMask();

});

$(window).resize(function(){
  resizeSim();
});


initSimMask = function () {
	var backgroundWidth = 100.0 / lumiWidth;
	var backgroundHeight = 100.0 / lumiHeight;
	simMask.css('background-size', backgroundWidth+'% '+backgroundHeight+'%');
}

/*
*	Will remove the canvas of the given ID and create a new one.
*	Calls createProcessingInstance and returns the instance.
*/

refreshCanvas = function(){
	if($('#'+canvasId)[0]){
		$('#'+canvasId).remove();
	}

	var newCanvas = $('<canvas></canvas>');
	newCanvas.attr('id', canvasId);
	newCanvas.attr('width', lumiWidth);
	newCanvas.attr('height', lumiHeight);
	canvasParent.append(newCanvas);
};

reset = function(procInstance){
	procInstance.exit();
  refreshCanvas();
	lumi.reset();
}

runProcessingCode = function(code) {
  refreshCanvas();
  return createProcessingInstance(code);
}

/*
*	Ends procInstance, starts a new instance for the given canvasId
*	with the given Processing code and returns it.
*/
createProcessingInstance = function(code){

	var simMouseHandlers = new SimMouseHandlers($('#'+canvasId), simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);

	var newProcInstance = new Processing(canvasId, code);

	newProcInstance.externals.sketch.onFrameEnd = function() {
		//console.log("X,Y: ", newProcInstance.mouseX, newProcInstance.mouseY)

		var imageData = newProcInstance.toImageData(0, 0, lumiWidth, lumiHeight).data;

		var pixels = [];
			for(var i=0, l=imageData.length; i<l; i+=4) {
				pixels.push(Math.floor(convertColor(imageData[i    ], 255)/2)); // divide by two as Processing works with
				pixels.push(Math.floor(convertColor(imageData[i + 1], 255)/2)); // 8-bit colors but lumi uses 7-bit
				pixels.push(Math.floor(convertColor(imageData[i + 2], 255)/2));
			}
			if(lumi){
				lumi.sendFrame(pixels);
			}
		}

		//convertColor provides quadratic easing, resulting in lower levels when value is closer to 0.
		function convertColor(value, maximum){
			var maximumSq = maximum*maximum
			var valueSq = value*value;
			var newColor = valueSq / maximumSq * maximum;
			return newColor;
		}

	/*newProcInstance.externals.sketch.onFrameStart = function() {
	};	*/

	return newProcInstance;
}

/*
*	SimMouseHandlers catches mouse events on the simMaskElement, translates them to lumi dimensions and
*	applies them to simElement.
*/
SimMouseHandlers = function(simElement, simMaskElement, maskWidth, maskHeight, lumiWidth, lumiHeight){

	var lumiX = 0;
	var lumiY = 0;

	simMaskElement.mousedown(function(e) {
		createEvent(e, 'mousedown');
	});

	simMaskElement.mousemove(function(e) {
		createEvent(e, 'mousemove');
	});

	simMaskElement.mouseup(function(e) {
		createEvent(e, 'mouseup');
	});

	simMaskElement.mouseover(function(e) {
		createEvent(e, 'mouseover');
	});

	simMaskElement.mouseout(function(e) {
		createEvent(e, 'mouseout');
	});

	function createEvent(e, event){
		var coords = coordinatesToLumi(e);
		lumiX = coords['x'];
		lumiY = coords['y'];



		//console.log('Simulating '+event+' at x='+lumiX+', y='+lumiY);

		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(event, true, true, window,
			0, lumiX, lumiY, lumiX, lumiY, false, false, false, false, 0, null);

		simElement[0].dispatchEvent(evt);

		/*
		Argments for initMouseEvent:

		type, canBubble, cancelable, view,
		detail, screenX, screenY, clientX, clientY,
		ctrlKey, altKey, shiftKey, metaKey,
		button, relatedTarget
		*/
	}

	/*
	*	Gets coordinates from the Event e and returns them as coordinates calculated to lumiWidth and lumiHeight.
	*	Offset is added because processing.js will substract it again.
	*/
	function coordinatesToLumi(e){
		var Offset = simMaskElement.offset();

		var newX = e.pageX - Offset.left;
		// -2 because otherwise there would be a slight offset.
		newX = Math.floor(newX / maskWidth * lumiWidth, 0) - 2;
		newX += Offset.left;

		var newY = e.pageY - Offset.top;
		// -1 because otherwise there would be a slight offset.
		newY = Math.floor(newY / maskHeight * lumiHeight, 0) - 1;
		newY += Offset.top;

		////console.log('coordinatesToLumi lumi width:'+lumiWidth+', height:'+lumiHeight);
		////console.log('coordinatesToLumi x:'+newX+', y:'+newY);

		return ({
			'x': newX,
			'y': newY
		});
	}

	function getLumiCoords(){
		return ({
			'x': lumiX,
			'y': lumiY
		});
	}

	return{
		getLumiCoords: getLumiCoords
	}

}
