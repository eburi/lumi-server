
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/


$(document).ready(function(){
	

	var lumiLearn = new LumiLearn(
		$('.tryButton'),
		$('#stopButton'),
		'.learnCode',
		'simCanvas',
		$('#sim'),
		$('#simMask'),
		320,
		320,
		32,
		32
	);
	
	function LumiLearn(
		tryButtons,
		stopButton,
		codeDivClass,
		canvasId,
		simDiv,
		simMask,
		maskWidth,
		maskHeight,
		lumiWidth,
		lumiHeight
	){
		var procInstance = null;
		initSimMask(simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		
		tryButtons.click(function() {
			stopButton.removeClass('buttonDisabled');
			var element = $(this);
			var code = element.parent().children(codeDivClass).html();
			
			procInstance = runProcessingCode(procInstance, code, canvasId, simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		});
		
		
		stopButton.click(function() {
			reset(procInstance, canvasId, simDiv, lumiWidth, lumiHeight);
			stopButton.addClass('buttonDisabled');
		});
	}
	
});
