
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

$(document).ready(function(){


	/*
	*	toolList contains all information needed to initiate all tools. To add a tool, make an object NewToolName(canvas) and add it to this list.
	*/
	var toolList = [
		{
			toolName: 'freeLine',
			tooltip: 'Freeline', //Display name
			create: function(canvas){
				return new FreeLineTool(canvas);
			}
		},
		{
			toolName: 'line',
			tooltip: 'Line',
			create: function(canvas){
				return new LineTool(canvas);
			}
		},
		{
			toolName: 'rectangle',
			tooltip: 'Rectangle',
			create: function(canvas){
				return new RectangleTool(canvas);
			}
		},
		{
			toolName: 'circle',
			tooltip: 'Circle',
			create: function(canvas){
				return new CircleTool(canvas);
			}
		},
		{
			toolName: 'eraser',
			tooltip: 'Eraser',
			create: function(canvas){
				return new EraserTool(canvas);
			}
		}
	];

	/*
	*	settingsList is used to initiate all settings. Currently, only the types number and checkbox are implemented.
	*	To add a type, edit lumiDraw.addSetting();
	*/

	var settingsList = [
		{
			settingName: 'fillShapes',
			settingLabel: 'Fill shapes',
			settingType: 'checkbox',
			settingValue: false  //Default value
		},
		{
			settingName: 'lineWidth',
			settingLabel: 'Line width:',
			settingType: 'number',
			settingValue: 1
		},
		{
			settingName: 'eraserDiameter',
			settingLabel: 'Eraser diameter:',
			settingType: 'number',
			settingValue: 5
		}
	];

	//See below for a detailed documentation for LumiDraw.
	var lumiDraw = new LumiDraw(
		toolList,
		settingsList,
		48,
		$('#colorDiv'),
		$('#toolDiv'),
		$('#settingsDiv'),
		$('#drawDiv'),
		$('#drawCanvas'),
		$('#simMask'),
		$('#simCanvas'),
		$('#resetButton'),
		320,
		320,
		32,
		32
	);

	/*
	*	lumiDraw initiates the draw tool, including adding GUI features and initialising the drawPad object.
	*	lumiDraw is also responsible for catching DOM events (Except for mouse actions on the drawpad, cursorTracker
	*	takes care of that).
	*/
	function LumiDraw(
		toolList,		// List of all tools as documented above.
		settingsList,	// List of all settings as documented above.
		colorAmount,	// This amount of Colours will be generated and added to the palette.
		colorDiv,		// DOM element as container for all colours (palette).
		toolDiv,		// DOM element as container for all tools.
		settingsDiv,	// DOM element as container for all settings
		drawDiv,		// DOM element for click events on the drawpad (lies above the canvas).
		drawCanvas,		// Canvas element on which all shapes are rendered. Its content is sent to the LED wall.
		simMask,		// DOM element which acts as a mask (to recreate the LED wall's visuals).
		simCanvas,		// Canvas which acts as a preview for the LED wall. (Simply mirrors drawDiv's content)
		resetButton,	// DOM element which acts as a reset (clear) button to clear all shapes.
		drawDivWidth,	// drawDiv's width.
		drawDivHeight,	// drawDiv's height.
		lumiWidth,		// Width of the LED Wall. drawCanvas will be resized to this width.
		lumiHeight		// Height of the LED Wall. drawCanvas will be resized to this height.
		// NOTE: lumiWidth and lumiHeight must be correct or there will be an error in lumi.js.
	){


		drawCanvas.attr('width', lumiWidth); // Note: .width() would merely set a css style
		drawCanvas.attr('height', lumiHeight);
		simCanvas.attr('width', lumiWidth);
		simCanvas.attr('height', lumiHeight);


		// Adapt mask pixel width for drawpad and simulator
    //init sim & draw mask
    var backgroundWidth = drawDivWidth / lumiWidth;
    var backgroundHeight = drawDivHeight / lumiHeight;
    simMask.css('background-size', backgroundWidth+'px '+backgroundHeight+'px');
    drawDiv.css('background-size', backgroundWidth+'px '+backgroundHeight+'px');

		// See below for a detailed documentation of drawPad.
		drawPad = new DrawPad(
			toolList,
			drawDiv,
			drawCanvas,
			simCanvas,
			drawDivWidth,
			drawDivHeight,
			lumiWidth,
			lumiHeight
		);

		initColors();
		initSettings();
		initTools();

		//Default color and tool are activated
		var colorElement = colorDiv.children().first();
		useColor(colorElement.attr('colR'), colorElement.attr('colG'), colorElement.attr('colB'), colorElement);
		var toolElement = toolDiv.children().first();
		useTool(toolElement.attr('toolName'), toolElement);

		//Initialises all settings, see addSetting for a more detailed documentation
		function initSettings(){
			for(item in settingsList){
				addSetting(settingsList[item]);
			}
		}

		/*
		*	Creates the necessary DOM elements for each setting and adds them to settings[] in drawPad.
		*/
		function addSetting(settingItem){
			var toAppend = $('<div></div>');
			toAppend.addClass('settingsElement');
			toAppend.attr('settingName', settingItem.settingName);
			toAppend.attr('settingType', settingItem.settingType);
			toAppend.attr('settingValue', settingItem.settingValue);

			// Generating DOM elements for checkbox type settings
			if(settingItem.settingType == 'checkbox'){
				var checkbox = $('<div class="checkbox"></div>');
				if(settingItem.settingValue == true){
					checkbox.addClass('checked');
				}
				toAppend.append(checkbox);
				toAppend.append(settingItem.settingLabel);
			}

			// Generating DOM elements for number type settings
			if(settingItem.settingType == 'number'){
				var input = $('<input type="text" class="settingsInput" />');
				input.val(settingItem.settingValue);
				toAppend.append(settingItem.settingLabel);
				toAppend.append(input);
			}

			settingsDiv.append(toAppend);
			drawPad.addSetting(settingItem); // Adds to drawPad.settings[]
		}

		// Initialises all tools, see addTool for a more detailed documentation
		function initTools(){
			for(item in toolList){
				addTool(toolList[item].toolName);
			}
		}

		/*
		*	Unlike addSetting, addTool ONLY affects the DOM.
		*/
		function addTool(toolName){
			var toAppend = $('<div></div>');
			toAppend.addClass('toolItem');
			toAppend.addClass('drawElement');
			toAppend.attr('style', 'background-image: url("./media/toolThumbs/'+toolName+'.png")');
			toAppend.attr('toolName', toolName);
			toolDiv.append(toAppend);
		}

		/*
		*	Is called by the click handlers for the elements in toolDiv.
		*	Activates the tool in drawPad and changes styles to give visual feedback.
		*/
		function useTool(tool, element){
			drawPad.setActiveTool(tool);

			$('.activeTool').removeClass('activeTool');
			element.addClass('activeTool');
		}

		/*
		*	Initiates the colour palette.
		*	colorAmount determines how many colours are to be added.
		*	A third of these colours will be bight, saturated colours.
		*	Another third will be darker and the rest are greyscales from black to white.
		*/
		function initColors(){

			this.amountThird = Math.floor(colorAmount/3);
			this.amountRest =  amountThird + colorAmount%3;

			for(var a = 0; a < amountRest; a++){ //First, some high-saturation colors are added.
				this.currentColor = getRGBbyPercent(a/amountRest*100);
				addColor(this.currentColor[0], this.currentColor[1], this.currentColor[2]);
			}

			for(var a = 0; a < amountThird; a++){ //Then, darker colors are added
				this.currentColor = getRGBbyPercent(a/amountThird*100);
				addColor(Math.floor(this.currentColor[0]/2.5),
					Math.floor(this.currentColor[1]/2.5),
					Math.floor(this.currentColor[2]/2.5));
			}

			for(var a = 0; a < amountThird; a++){ //Finally, greyscales are added
				this.grayAmount = Math.floor(a/amountThird*255);
				addColor(grayAmount, grayAmount, grayAmount);
			}
		}

		/*
		*	The colour palette is generated by adding elements to colorDiv.
		*/
		function addColor(r, g, b){
			var toAppend = $('<div></div>');
			toAppend.addClass('drawElement');
			toAppend.addClass('colorItem');
			toAppend.attr('style', 'background-color: rgb('+r+', '+g+', '+b+')');
			toAppend.attr('colR', r);
			toAppend.attr('colG', g);
			toAppend.attr('colB', b);
			colorDiv.append(toAppend);
		}

		/*
		*	Is called by the click handlers for the elements in colorDiv.
		*	Activates the color in drawPad and changes styles to give visual feedback.
		*/
		function useColor(r, g, b, element){
			drawPad.setActiveColor('rgb('+r+', '+g+', '+b+')');

			$('.activeColor').removeClass('activeColor');
			element.addClass('activeColor');
		}

		/*
			Given a value between 0 and 100, getRGBbyPercent will return an array [r, g, b]
		*/
		function getRGBbyPercent(percent){
			this.r = 0;
			this.g = 0;
			this.b = 255;

			this.step = 16.66; 	// Value to be added for each step.
			this.cycleStep = 0; // Depending on this, a color r, g or b will be added or substracted.
								// Is incremented when the current color reaches 0 respectively 255

			//This is rather slow, but it does the job and time was limited.
			for (var i = 0; i <= percent; i++){
				if(this.cycleStep == 0){
					this.r += this.step;
					if(this.r >= 255){
						this.r = 255;
						this.cycleStep++;
					}
				} else if(this.cycleStep == 1){
					this.b -= this.step;
					if(this.b <= 0){
						this.b = 0;
						this.cycleStep++;
					}
				} else if(this.cycleStep == 2){
					this.g += this.step;
					if(this.g >= 255){
						this.g = 255;
						this.cycleStep++;
					}
				} else if(this.cycleStep == 3){
					this.r -= this.step;
					if(this.r <= 0){
						this.r = 0;
						this.cycleStep++;
					}
				} else if(this.cycleStep == 4){
					this.b += this.step;
					if(this.b >= 255){
						this.b = 255;
						this.cycleStep++;
					}
				} else if(this.cycleStep == 5){
					this.g -= this.step;
					if(this.g <= 0){
						this.g = 0;
						this.cycleStep = 0;
					}
				}
			}

			this.r = Math.floor(this.r);
			this.g = Math.floor(this.g);
			this.b = Math.floor(this.b);

			return [this.r, this.g, this.b];
		}

		$('.colorItem').click(function(e){
			var element = $(this);
			useColor(element.attr('colR'), element.attr('colG'), element.attr('colB'), element);
		});

		$('.toolItem').click(function(e){
			var element = $(this);
			useTool(element.attr('toolName'), element);
		});


		/*
		*	If a checkbox setting is clicked, there will be visual feedback and drawPad.settings[] will be updated.
		*	If a number setting is clicket, its content will be selected.
		*/
		$('.settingsElement').click(function(e){
			var element = $(this);

			if(element.attr('settingType') == 'checkbox'){
				if(element.attr('settingValue') == 'true'){
					element.attr('settingValue', 'false');
					element.children().first().removeClass('checked');
				} else {
					element.attr('settingValue', 'true');
					element.children().first().addClass('checked');
				}
				drawPad.updateSetting(element.attr('settingName'), element.attr('settingValue'));

			} else if(element.attr('settingType') == 'number'){
				element.find('.settingsInput').select();
			}
		});


		/*
		*	On keyup, the contents of a number type setting are filtered from non-numbers
		*	and stored in drawPad.settings[].
 		*/
		$('.settingsInput').keyup(function(e){
			var element = $(this);
			element.val(element.val().replace(/[^0-9]/g, '')); //Filter out all non-numbers


			element.parent().attr('settingValue', element.val());

			if(element.parent().attr('settingValue') == '' || element.parent().attr('settingValue') == 0){
				element.parent().attr('settingValue', 1);
			}

			drawPad.updateSetting(element.parent().attr('settingName'), element.parent().attr('settingValue'));
		});

		resetButton.click(function(e){
			drawPad.reset();
		});


		/*
		*	A file is dropped over the drawDiv
		*	If it is a gif, a png or a jpg image, it is added to the drawing.
		*/

		var gifHandler = null;

		function handleFileSelect(e) {
			e.stopPropagation();
			e.preventDefault();

			var files = e.dataTransfer.files;

			var output = [];
			var fileExtension = files[0].name.split('.').pop().toLowerCase();

			if(fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'gif' || fileExtension == 'ico' || fileExtension == 'bmp'){
				console.log(files[0]);

				var reader = new FileReader;
				reader.onload = function(event) {

					if(fileExtension == 'gif'){
						var toAppend = $('<img />');
						//toAppend.css('visibility', 'hidden');
						toAppend.attr('src', reader.result);
						drawDiv.empty();
						drawDiv.append(toAppend);

						/*if(typeof gifHandler != 'undefined'){
							gifHandler.stop();
						}*/
						gifHandler = new GifHandler(toAppend, drawCanvas);

					} else {
						var img = new Image;

						img.onload = function() {
							drawImageOnCanvas(img);
						}
						img.src = event.target.result;
					}
				}
				reader.readAsDataURL(files[0]);
			}
		}

		function GifHandler(img){

			var interval = setInterval(send, 30);

			function stop(){
				clearInterval(interval);
			}

			function send(){
				//drawPad.reset();
				drawImageOnCanvas(img[0]);
				console.log('sending');
			}
		}

		//img.src = fr.result;

		function drawImageOnCanvas(img){
			var width = img.width;
			var height = img.height;

			//console.log('width:'+width+', height:'+height);

			if (width > height) {
				if (width > lumiWidth) {
					height *= lumiWidth / width;
					width = lumiWidth;
				}
			}
			else {
				if (height > lumiHeight) {
					width *= lumiHeight / height;
					height = lumiHeight;
				}
			}

			//console.log('width:'+width+', height:'+height);

			drawCanvas[0].getContext('2d').drawImage(img, lumiWidth/2 - width/2 , lumiHeight/2 - height/2, width, height);
			//alert('the image is drawn');
		}

		function handleDragOver(e) {
			e.stopPropagation();
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
		}

		// Setup the dnd listeners.
		drawDiv[0].addEventListener('dragover', handleDragOver, false);
		drawDiv[0].addEventListener('drop', handleFileSelect, false);



		function getDrawPad(){
			return drawPad;
		}

		return{
			getDrawPad: getDrawPad
		}

	}

	/*
	*	DrawPad manages tools, colours and settings and is responsible for sending data to the LED wall.
	*/
	function DrawPad(
		toolList,
		drawDiv,
		drawCanvas,
		simCanvas,
		drawDivWidth,
		drawDivHeight,
		lumiWidth,
		lumiHeight
	){


		var cursorTracker = new CursorTracker(drawDiv, drawDivWidth, drawDivHeight, lumiWidth, lumiHeight);
			// cursorTracker manages mouse events on drawDiv and calculates relative positions on the canvas.
		var drawing = false;
			// Tools won't draw if drawing is false. Drawing is true as long as the mouse button is pressed.
		var activeTool = null;
			// References the active tool.
		var activeColor = null;
			// Stores the RGB value for the active color as a string in the following format: rgb(r, g, b)
		var storedImage;
			// Contains imageData from the canvas and is stored whenever a tool has finished a shape.
		var canvasCtx = drawCanvas[0].getContext('2d');
		var settings = [];
			// Contains the list of setting objects.
		var sendFrameInterval = setInterval(sendFrame, 18);
			// Initialises an interval which sends frames to the LED wall.
			// 18ms roughly equal a frame rate of 60fps.
			// Note that this will send frames even when nothing has changed.

		reset(); // Paints the canvas black. (Initially it has a transparent background which would cause problems with Lumi)

		function setActiveColor(rgb){
			activeColor = rgb;
		}

		function getActiveColor(){
			return activeColor;
		}

		function setActiveTool(toolName){
			for(item in toolList){
				if(toolList[item].toolName == toolName){
					activeTool = toolList[item].create(drawCanvas);
				}
			}
		}

		/*
		*	Is called by cursorTracker and calls the active tool's draw function.
		*/
		function draw(startX, startY, x, y){
			if(drawing != false){
				putStoredImage();

				activeTool.draw(startX, startY, x, y);

				//sendFrame();	//Replaced by sendFrameInterval as sending frames at a fixed rate has turned out to bring better
								//performance.
			}
		}

		/*
		*	Sends data to the LED wall.
		*	See lumi.js for a detailed Documentation (lumi.js was made by E. Buri)
		*/
		function sendFrame(){

			var imageData = canvasCtx.getImageData(0,0,lumiWidth,lumiHeight);

			simCanvas[0].getContext("2d").putImageData(imageData, 0, 0); //Updates the simulator

			imageData = imageData.data;

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

		function getCursorTracker(){
			return cursorTracker;
		}

		function setDrawing(newDrawing){
			storeImage();
			drawing = newDrawing;

			if(drawing == false){
				activeTool.endDrawing();
			}
		}

		/*
		*	Clears the canvas to black.
		*/
		function reset(){
			canvasCtx.beginPath();
			canvasCtx.rect(0, 0, lumiWidth, lumiHeight);
			canvasCtx.fillStyle = "rgb(0, 0, 0)";
			canvasCtx.fill();
			canvasCtx.closePath();

			storeImage();
			putStoredImage();

			sendFrame();
		}

		function storeImage(){
			storedImage = canvasCtx.getImageData(0, 0, lumiWidth, lumiHeight);
		}

		function putStoredImage(){
			canvasCtx.putImageData(storedImage, 0, 0);
		}

		function addSetting(Setting){
			settings.push(Setting);
		}

		function updateSetting(settingName, value){
			for(item in settings){
				if(settings[item].settingName == settingName){
					settings[item].settingValue = value;
				}
			}
		}

		function getSetting(settingName){
			for(item in settings){
				if(settings[item].settingName == settingName){
					return settings[item].settingValue;
				}
			}
		}

		return {
			setActiveColor: setActiveColor,
			getActiveColor: getActiveColor,
			setActiveTool: setActiveTool,
			draw: draw,
			getCursorTracker: getCursorTracker,
			setDrawing: setDrawing,
			reset: reset,
			storeImage: storeImage,
			addSetting: addSetting,
			updateSetting: updateSetting,
			getSetting: getSetting
		}
	}

	/*
		Tool is aggregated by each tool (LineTool, etc) and delivers the canvas' context.
	*/
	function Tool(canvas) {
		this.canvas = canvas;
		this.canvasCtx = this.canvas[0].getContext('2d');
	}

	/*
	*	About the function draw(startX, startY, x, y) in tools:
	*	draw() will effectively draw on the canvas.
	*	startX and startY mark the position of the last mouseDown (delivered by cursorTracker).
	*	x and y mark the current position (delivered by cursorTracker).
	*/


	/*
	*	Draws a straight line
	*/
	function LineTool(canvas) {
		var t = new Tool(canvas);

		function endDrawing(){
		}

		function draw(startX, startY, x, y){
			t.canvasCtx.beginPath();
			t.canvasCtx.lineWidth = lumiDraw.getDrawPad().getSetting('lineWidth');
			t.canvasCtx.strokeStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.moveTo(startX, startY);
			t.canvasCtx.lineTo(x, y);
			t.canvasCtx.closePath();
			t.canvasCtx.stroke();
		}

		return{
			draw: draw,
			endDrawing: endDrawing
		}
	}

	/*
	*	Draws a rectangle
	*/
	function RectangleTool(canvas) {
		var t = new Tool(canvas);

		function endDrawing(){
		}

		function draw(startX, startY, x, y){
			t.canvasCtx.beginPath();
			t.canvasCtx.lineWidth = lumiDraw.getDrawPad().getSetting('lineWidth');
			t.canvasCtx.strokeStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.fillStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.rect(startX, startY, x-startX, y-startY);
			t.canvasCtx.closePath();
			t.canvasCtx.stroke();

			if(lumiDraw.getDrawPad().getSetting('fillShapes') == 'true'){
				t.canvasCtx.fill();
			}
		}

		return{
			draw: draw,
			endDrawing: endDrawing
		}
	}

	/*
	*	Draws a rectangle where the radius is the distance between the last mouseDown and the current
	*	cursor position.
	*/
	function CircleTool(canvas) {
		var t = new Tool(canvas);
		t.toolName = 'circleTool';

		function endDrawing(){
		}

		function draw(startX, startY, x, y){

			var radius = Math.sqrt(Math.pow((startX - x), 2) + Math.pow((startY - y), 2)); //euclidean distance
			t.canvasCtx.beginPath();
			t.canvasCtx.lineWidth = lumiDraw.getDrawPad().getSetting('lineWidth');
			t.canvasCtx.strokeStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.fillStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.arc(startX, startY, radius, 0, 2*Math.PI);
			t.canvasCtx.closePath();

			t.canvasCtx.stroke();

			if(lumiDraw.getDrawPad().getSetting('fillShapes') == 'true'){
				t.canvasCtx.fill();
			}
		}

		return{
			draw: draw,
			endDrawing: endDrawing
		}
	}

	/*
	*	Draws a line between the last recorded mouse position and the current one, resulting in drawing a free line
	*	following cursor movement.
	*/
	function FreeLineTool(canvas) {
		var t = new Tool(canvas);
		var lastX;
		var lastY;

		function endDrawing(){
			lastX = undefined;
			lastY = undefined;
		}

		function draw(startX, startY, x, y){
			if(lastX === undefined || lastY === undefined){
				lastX = startX;
				lastY = startY;
			}
			t.canvasCtx.beginPath();
			t.canvasCtx.lineCap = 'round';
			t.canvasCtx.lineWidth = lumiDraw.getDrawPad().getSetting('lineWidth');
			t.canvasCtx.strokeStyle = lumiDraw.getDrawPad().getActiveColor();
			t.canvasCtx.moveTo(lastX, lastY);
			t.canvasCtx.lineTo(x, y);
			t.canvasCtx.moveTo(x, y); //Fixes a problem in Chrome
			t.canvasCtx.closePath();
			t.canvasCtx.stroke();

			lumiDraw.getDrawPad().storeImage(); // storeImage is usually called on mouseUp.
												// It is called here because FreeLineTool continuously draws
												// on the canvas.

			lastX = x;
			lastY = y;
		}

		return{
			draw: draw,
			endDrawing: endDrawing
		}
	}

	/*
	*	Draws a black, filled circle around the current mouse position.
	*	The circle's diameter is defined by the setting eraserDiameter.
	*/
	function EraserTool(canvas) {
		var t = new Tool(canvas);

		function endDrawing(){
		}

		function draw(startX, startY, x, y){

			var radius = lumiDraw.getDrawPad().getSetting('eraserDiameter') / 2;
			t.canvasCtx.beginPath();
			t.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
			t.canvasCtx.arc(x, y, radius, 0, 2*Math.PI);
			t.canvasCtx.closePath();
			t.canvasCtx.fill();

			lumiDraw.getDrawPad().storeImage();	// Like FreeLineTool, Eraser continuously draws on the canvas.
		}

		return{
			draw: draw,
			endDrawing: endDrawing
		}
	}

	/*
	*	Given the size of drawDiv (which catches mouse events) and the size of the LED wall, CursorTracker returns
	*	the current position.
	*
	*	CursorTracker also fires the drawPad.draw() method and sets drawPad.drawing.
	*/
	function CursorTracker(drawDiv, drawDivWidth, drawDivHeight, lumiWidth, lumiHeight){

		var x = 0; // Current coordinates
		var y = 0;

		var startX = 0; // Coordinates at last mouseDown
		var startY = 0;

		drawDiv.mousedown(function(e){
			x = getLumiX(e);
			y = getLumiY(e);

			startX = getLumiX(e);
			startY = getLumiY(e);

			lumiDraw.getDrawPad().setDrawing(true);
			lumiDraw.getDrawPad().draw(startX, startY, x, y);
		});

		$(window).mousemove(function(e){ 	// While starting to draw is only possible on the drawpad, it should not stop
											// when leaving the drawPad's borders.
			x = getLumiX(e);
			y = getLumiY(e);
			lumiDraw.getDrawPad().draw(startX, startY, x, y);
		});

		$(window).mouseup(function(e){ 		// While starting to draw is only possible on the drawpad,
											// a mouseUp event shoud stop drawing anywhere on the screen.
			x = getLumiX(e);
			y = getLumiY(e);
			lumiDraw.getDrawPad().draw(startX, startY, x, y);
			lumiDraw.getDrawPad().setDrawing(false);
		});

		/*
		*	getLumiX() and getLumiY() get the relative position of the mouse event and calculate
		*	the appropriate value for the canvas.
		*/
		function getLumiX(e){
			var Offset = drawDiv.offset();
			var x = e.pageX - Offset.left;
			return Math.floor(x / drawDivWidth * lumiWidth, 0) + 0.5; 	// +0.5 because of how canvas renders
		}

		function getLumiY(e){
			var Offset = drawDiv.offset();
			var y = e.pageY - Offset.top;
			return Math.floor(y / drawDivHeight * lumiHeight, 0) + 0.5;
		}

		return{
		}
	}

});
