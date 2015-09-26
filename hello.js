'use strict';

var lumiDevice = require('./lumi_raspberrypi.js');
lumiDevice.open();

var WIDTH = 32;
var HEIGHT = 32;

var evenBuffer = new Buffer(WIDTH * HEIGHT * 3);
var oddBuffer = new Buffer(WIDTH * HEIGHT * 3);

for(var y=0; y < HEIGHT; y++) {
  for(var x=0; x < WIDTH; x++) {
    var pos = (y * WIDTH + x);
    var fPos = pos * 3;
    evenBuffer[fPos    ] = (y % 2 === 0) ? 0x00 : 0x80; // R
    evenBuffer[fPos + 1] = (y % 2 === 0) ? 0x00 : 0x80; // G
    evenBuffer[fPos + 2] = (y % 2 === 0) ? 0x00 : 0x80; // B

    oddBuffer[fPos    ] = (y % 2 === 1) ? 0x00 : 0x80; // R
    oddBuffer[fPos + 1] = (y % 2 === 1) ? 0x00 : 0x80; // G
    oddBuffer[fPos + 2] = (y % 2 === 1) ? 0x00 : 0x80; // B
  }
}

var DELAY = 1000/25;
var odd = true;
setInterval(function() {
  odd = !odd;
  lumiDevice.sendFrame(odd ? oddBuffer : evenBuffer);
}, DELAY);
