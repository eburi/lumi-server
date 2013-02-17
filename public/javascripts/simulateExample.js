
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/



$(document).ready(function(){
	
	/*
	*	examplesList contains the data for all examples, allowing the easy addition
	*	of more elements.
	*/
	var examplesList = [
		{
			exampleName: 'cube',
			exampleDisplayName: '3D Cube', //Display name
			exampleSrc: './pdeSnippets/cube.pde',
			exampleImg: './media/exampleThumbs/cube.png',
			exampleDesc: 'A rotating 3D cube which changes colour.'
		},
		{
			exampleName: 'star',
			exampleDisplayName: 'Star',
			exampleSrc: './pdeSnippets/star.pde',
			exampleImg: './media/exampleThumbs/star.png',
			exampleDesc: 'Zooming into the stars!'
		},
		{
			exampleName: 'time',
			exampleDisplayName: 'Time',
			exampleSrc: './pdeSnippets/time.pde',
			exampleImg: './media/exampleThumbs/time.png',
			exampleDesc: 'A digital clock. The values change colour depending on the current time.'
		},
		{
			exampleName: 'alphabet',
			exampleDisplayName: 'Alphabet',
			exampleSrc: './pdeSnippets/alphabet.pde',
			exampleImg: './media/exampleThumbs/alphabet.png',
			exampleDesc: 'A demonstration of text rendering in Processing.'
		},
		{
			exampleName: 'gradients',
			exampleDisplayName: 'Gradients',
			exampleSrc: './pdeSnippets/gradients.pde',
			exampleImg: './media/exampleThumbs/gradients.png',
			exampleDesc: 'Animated, colourful gradients.'
		},
		{
			exampleName: 'mouseCircle',
			exampleDisplayName: 'Mouse I',
			exampleSrc: './pdeSnippets/mouseCircle.pde',
			exampleImg: './media/exampleThumbs/mouseCircle.png',
			exampleDesc: 'This circle will follow your cursor.'
		},
		{
			exampleName: 'mousePointer',
			exampleDisplayName: 'Mouse II',
			exampleSrc: './pdeSnippets/mousePointer.pde',
			exampleImg: './media/exampleThumbs/mousePointer.png',
			exampleDesc: 'This is a good example for learning to use mouse positions in your sketches.'
		},
		{
			exampleName: 'pong',
			exampleDisplayName: 'Pong',
			exampleSrc: './pdeSnippets/pong.pde',
			exampleImg: './media/exampleThumbs/pong.png',
			exampleDesc: 'Play pong against the wall!'
		}
	]
	
	var lumiExamples = new LumiExamples(
		examplesList,
		'simCanvas',
		$('#sim'),
		$('#simMask'),
		'.tryButton',
		$('#editArea'),
		$('#stopButton'),
		320,
		320,
		32,
		32
	);
	
	function LumiExamples(
		examplesList,
		canvasId, 				// String: ID of the simulator's canvas element.
		simDiv,					// Element to which the simulator's canvas is added.
		simMask,				// Div element which acts as a mask for LED-style visuals.
		simulateButtonClass,	// String: "Try it!" button class.
		examplesParent,			// Parent element of all example elements.
		stopButton,				// 'Stop' button div
		maskWidth,				// Width of the mask div
		maskHeight,				// Height of the mask div
		lumiWidth,				// LED wall height
		lumiHeight				// LED wall width
								// lumiHeight and lumiWidth have to be correct or Lumi will not work correctly.
	){	
		// running is true while an example is being executed.
		var running = false;
		var procInstance = null;
		initExamples();
		initSimMask(simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		
		// Initialises all examples
		function initExamples(){
			for(item in examplesList){
				addExample(examplesList[item]);
			}
		}
		
		// Returns an example object matching the given string.
		function getExampleByName(exampleName){
			for(item in examplesList){
				if(examplesList[item].exampleName == exampleName){
					return examplesList[item];
				}
			}
		}
		
		/*
		*	Adds the HTML code for one example.
		*/
		function addExample(example){
		
			var toAppend = $('<div></div>');
			toAppend.addClass('exampleOuter');
			toAppend.attr('example', example.exampleName);
			
			var appendImg = $('<img />');
			appendImg.addClass('exampleImage');
			appendImg.attr('src', example.exampleImg);
			appendImg.attr('width', 64);
			appendImg.attr('height', 64);
			toAppend.append(appendImg);
			
			var appendTitle = $('<h2></h2>');
			appendTitle.addClass('exampleTitle');
			appendTitle.html(example.exampleDisplayName);
			toAppend.append(appendTitle);
			
			var appendDesc = $('<span></span>');
			appendDesc.addClass('exampleDesc');
			appendDesc.html(example.exampleDesc);
			toAppend.append(appendDesc);
			
			var appendTryButton = '<div class="exampleButton tryButton">\
				<img class="loadingImg" style="display: none;" title="" alt="Loading..." src="./media/ajaxLoading.gif">\
				<span class="tryButtonLabel">Try it!</span>\
				</div>';
			toAppend.append(appendTryButton);
			
			var appendEditButton = $('<a></a>');
			appendEditButton.addClass('exampleButton');
			appendEditButton.addClass('editButton');
			appendEditButton.attr('href', './index.html?file='+example.exampleName+'.pde');
			appendEditButton.html('Open in Editor');
			toAppend.append(appendEditButton);
			
			examplesParent.append(toAppend);
		}
		
		
		/*
		*	Gets the content of the .pde file for the selected example and passes it to simulateExample().
		*/
		$(simulateButtonClass).click(function() {
			
			var element = $(this);
			element.addClass('loading');
			element.children('.loadingImg').show();
			element.children('.tryButtonLabel').hide();
			var exampleName = element.parent().attr('example');
			var example = getExampleByName(exampleName);
		
		
			$.ajax({
				async: true,
				url: example.exampleSrc,
				success: simulateExample,
			});
		});
		
		/*
		*	Runs the example code in Processing and displays it on the simulator as well as on the LED wall.
		*/
		function simulateExample(code){
			stopButton.removeClass('buttonDisabled');
			element = $('.loading');
			element.children('.loadingImg').hide();
			element.children('.tryButtonLabel').show();
			element.removeClass('loading');
			
			procInstance = runProcessingCode(procInstance, code, canvasId, simDiv, simMask, maskWidth, maskHeight, lumiWidth, lumiHeight);
		}
		
		stopButton.click(function() {
			reset(procInstance, canvasId, simDiv, lumiWidth, lumiHeight);
			stopButton.addClass('buttonDisabled');
		});
	}
	
});
