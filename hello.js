'use strict';

var lumiDevice = require('lumi/lumi_raspberrypi.js');
lumiDevice.openPort();

var WIDTH = 32;
var HEIGHT = 32;

var evenBuffer = new Buffer(WIDTH * HEIGHT * 3);
var oddBuffer = new Buffer(WIDTH * HEIGHT * 3);

for (var y = 0; y < HEIGHT; y++) {
  for (var x = 0; x < WIDTH; x++) {
    var pos = (y * WIDTH + x);
    var fPos = pos * 3;
    var oddLine = (y % 2 === 0);
    evenBuffer[fPos] = !oddLine ? 0x00 : 0x80; // R
    evenBuffer[fPos + 1] = !oddLine ? 0x00 : 0x00; // G
    evenBuffer[fPos + 2] = !oddLine ? 0x00 : 0x00; // B

    oddBuffer[fPos] = oddLine ? 0x00 : 0x80; // R
    oddBuffer[fPos + 1] = oddLine ? 0x00 : 0x00; // G
    oddBuffer[fPos + 2] = oddLine ? 0x00 : 0x00; // B
  }
}

var DELAY = 5000;
var odd = true;

function printFrame() {
  odd = !odd;
  lumiDevice.sendFrame(odd ? oddBuffer : evenBuffer);
}

printFrame();
setInterval(printFrame, DELAY, true);
