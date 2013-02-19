
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

$(document).ready(function(){
	
	var aceInterface = new AceInterface("codeInput");
	
	var editorTool = new EditorTool(
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
	
	function AceInterface(inputId){

		var editor = ace.edit(inputId); // Initialises Ace on the input field
		editor.setTheme("ace/theme/monokai");

		var JavaMode = require("ace/mode/java").Mode; // Sets the Java highlight mode, as Java is closest to Processing.
		editor.getSession().setMode(new JavaMode());
		editor.setShowPrintMargin(false);
	
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
		
		// Is true while a sketch is being executed.
		var running = false;
		
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

    $('#sketchForm').submit(function (e) {

      e.preventDefault();

      var $form = $(this);
      $form.find('input[name="code"]').val(aceInterface.getContent());

      $.post('/sketches', $form.serialize(), function (data){
        if(!data.success) {
          alert('oops: ' + data.error);
        }
      }, 'json');

      return false;
    
    });
		
	
	}
	
	// Prints any errors into the debug area.
	window.onerror = function(msg, url, line){
		$('.boxInner.debugArea').append('<span class="error">Error: <span class="errorInner">'+msg+'</span> in <span class="errorInner">'+url+'</span> on line <span class="errorInner">'+line+'</span></span>');
	}
	
});
