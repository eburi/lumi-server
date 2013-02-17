
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

$(document).ready(function(){
	
	// List of files which are allowed to be passed as GET parameter.
	var allowedFiles = [
		'cube.pde',
		'star.pde',
		'alphabet.pde',
		'time.pde',
		'drawLine.pde',
		'mouseCircle.pde',
		'mousePointer.pde',
		'pong.pde'
	]
	
	var aceInterface = new AceInterface(
		"codeInput",
		'#themeSelect'
	);
	
	
	var editorTool = new EditorTool(
		allowedFiles,
		'simCanvas',
		$('#sim'),
		$('#simMask'),
		$('#applyButton'),
		$('.boxInner.debugArea'),
		320,
		320,
		32,
		32
	);
	
	function AceInterface(
		inputId, 		// String: ID of the input field
		themeSelect		// String: ID of the theme select field
	){

		var editor = ace.edit(inputId); // Initialises Ace on the input field
		var value = $(themeSelect).children('option:selected').val();
		editor.setTheme("ace/theme/"+value);

		var JavaMode = require("ace/mode/java").Mode; // Sets the Java highlight mode, as Java is closest to Processing.
		editor.getSession().setMode(new JavaMode());
		editor.setShowPrintMargin(false);

		$(themeSelect).change(function () {
			value = $(themeSelect).children('option:selected').val();
			editor.setTheme("ace/theme/"+value);
		});
	
		function getContent(){
			return editor.getSession().getValue();
		}
		
		function setContent(content){
			editor.getSession().setValue(content);
		}

		return {
			getContent: getContent,
			setContent: setContent
		};
	}

	function EditorTool(
		allowedFiles,
		canvasId,		// String: The canvas on which the sketch is rendered
		simDiv,			// Element in which the canvas is created
		simMask,		// Mask div
		applyButton,	// Button to run the code
		debugArea,		// Debug area div
		maskWidth,		// Width of the mask div
		maskHeight,		// Height of the mask div
		lumiWidth,		// LED wall width
		lumiHeight		// LED wall height
	){
		
		// Resizes the mask's background-image to represent one pixel on the LED wall
		initSimMask(simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		//var simMouseHandlers = new SimMouseHandlers(simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		// GET parameter for the .pde sketch to load
		var pdeToLoad = getUrlVars()["file"];
		
		// Is true while a sketch is being executed.
		var running = false;
		
		// If the file is allowed, it gets loaded via AJAX.
		if(pdeToLoad != '' || pdeToLoad != undefined){
			if(fileIsAllowed(pdeToLoad)){
				$.ajax({
					async: true,
					url: './pdeSnippets/'+pdeToLoad,
					success: aceInterface.setContent,
				});
			}
		}
		
		var procInstance = null;
		
		applyButton.click(function() {
			running = !running;
			
			if(running){
				applyButton.html('Stop');
				
				debugArea.empty();
				var code = aceInterface.getContent();

				procInstance = runProcessingCode(procInstance, code, canvasId, simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
			} else {
				applyButton.html('Start');
				
				reset(procInstance, canvasId, simDiv, lumiWidth, lumiHeight);
			}
		
		});
		
		function fileIsAllowed(fileName){
			for(item in allowedFiles){
				if(allowedFiles[item] == fileName){
					return true;
				}
			}
			return false;
		}
		
		function getUrlVars() { // Source: http://papermashup.com/read-url-get-variables-withjavascript/
			var vars = {};
			var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
			});
			return vars;
		}
			
		return {
		};
	
	}
	
	// Prints any errors into the debug area.
	window.onerror = function(msg, url, line){
		$('.boxInner.debugArea').append('<span class="error">Error: <span class="errorInner">'+msg+'</span> in <span class="errorInner">'+url+'</span> on line <span class="errorInner">'+line+'</span></span>');
	}
	
});
