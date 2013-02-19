
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/

$(document).ready(function(){
	
	var editor = new AceInterface("codeInput");
	
	var editorTool = new EditorTool(); 

	function AceInterface(inputId){

		var editor = ace.edit(inputId); // Initialises Ace on the input field
		editor.setTheme("ace/theme/monokai");

		var JavaMode = require("ace/mode/java").Mode; // Sets the Java highlight mode, as Java is closest to Processing.
		editor.getSession().setMode(new JavaMode());
		editor.setShowPrintMargin(false);
	
    return editor;

	}

	function EditorTool() {
		
		//var simMouseHandlers = new SimMouseHandlers(simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		// Is true while a sketch is being executed.
		var running = false;
		var procInstance = null;
    var applyButton = $('#applyButton');
    var sketchForm = $('#sketchForm');
    var timer;
    var saving = false;
		
		applyButton.click(function() {
			running = !running;
			
			if(running){
				applyButton.html('Stop');
        procInstance = runProcessingCode(editor.getValue());
			} else {
				applyButton.html('Start');
        reset(procInstance);
			}
		
		});

    function save () {

      sketchForm.find('input[name="sketch[code]"]').val(editor.getValue());
      if(saving) return;
      saving = true;

      $.post('/sketches', sketchForm.serialize(), function (data){
        if(!data.success) {
          console.log('oops: ' + data.error);
        } else {
          sketchForm.find('.saved').fadeIn(100).delay(500).fadeOut(100);
        }
        saving = false;
      }, 'json');
    
    }

    sketchForm.submit(function (e) { e.preventDefault(); });
    sketchForm.find('.save').click(function (e) { e.preventDefault(); save();});
    editor.on('change', function (e) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(save, 1000);
    });
		
	
	}
	
	// Prints any errors into the debug area.
	window.onerror = function(msg, url, line){
		$('.boxInner.debugArea').append('<span class="error">Error: <span class="errorInner">'+msg+'</span> in <span class="errorInner">'+url+'</span> on line <span class="errorInner">'+line+'</span></span>');
	}
	
});
