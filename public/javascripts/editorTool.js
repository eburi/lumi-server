
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

$(document).ready(function(){
	
	var aceInterface = new AceInterface("codeInput");
	
	var editorTool = new EditorTool(); 

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

	function EditorTool() {
		
		//var simMouseHandlers = new SimMouseHandlers(simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		// Is true while a sketch is being executed.
		var running = false;
		var procInstance = null;
    var applyButton = $('#applyButton');
		
		applyButton.click(function() {
			running = !running;
			
			if(running){
				applyButton.html('Stop');
        procInstance = runProcessingCode(aceInterface.getContent());
			} else {
				applyButton.html('Start');
        reset(procInstance);
			}
		
		});

    $('#sketchForm').submit(function (e) {

      e.preventDefault();

      var $form = $(this);
      $form.find('input[name="sketch[code]"]').val(aceInterface.getContent());

      $.post('/sketches', $form.serialize(), function (data){
        if(!data.success) {
          alert('oops: ' + data.error);
        }
      }, 'json');

      return false;
    
    });

    $('#sketchForm .save').click(function (e) { e.preventDefault(); $('#sketchForm').submit();});
		
	
	}
	
	// Prints any errors into the debug area.
	window.onerror = function(msg, url, line){
		$('.boxInner.debugArea').append('<span class="error">Error: <span class="errorInner">'+msg+'</span> in <span class="errorInner">'+url+'</span> on line <span class="errorInner">'+line+'</span></span>');
	}
	
});
