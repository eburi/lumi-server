
/**
*	@author Roland Rytz <roland.rytz@swisscom.com>
*/



/*
*	Simply resizes the transparent PNG background of the mask div to
*	simulate the visuals of the LED wall.
*/
initSimMask = function(
	maskDiv,
	maskWidth,
	maskHeight,
	lumiWidth,
	lumiHeight
){
	var backgroundWidth = maskWidth / lumiWidth;
	var backgroundHeight = maskHeight / lumiHeight;
	maskDiv.css('background-size', backgroundWidth+'px '+backgroundHeight+'px');
}