'use strict';

var fs = require('fs');

var WIDTH = 32;
var HEIGHT = 32;
var ZEROS_NEEDED = (3 * ((WIDTH * HEIGHT + 63) / 64));
var DEVICE = '/dev/spidev0.0';

var palette = null;
var stream = null;


var gamma = new Buffer([
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,
  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,  2,
  2,  3,  3,  3,  3,  3,  3,  3,  4,  4,  4,  4,  4,  5,  5,  5,
  5,  6,  6,  6,  6,  7,  7,  7,  7,  8,  8,  8,  9,  9,  9, 10,
  10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16,
  17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 24, 24, 25,
  25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 35, 35, 36,
  37, 38, 39, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50,
  51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68,
  69, 70, 72, 73, 74, 75, 77, 78, 79, 81, 82, 83, 85, 86, 87, 89,
  90, 92, 93, 95, 96, 98, 99,101,102,104,105,107,109,110,112,114,
  115,117,119,120,122,124,126,127,129,131,133,135,137,138,140,142,
  144,146,148,150,152,154,156,158,160,162,164,167,169,171,173,175,
  177,180,182,184,186,189,191,193,196,198,200,203,205,208,210,213,
  215,218,220,223,225,228,231,233,236,239,241,244,247,249,252,255 ]);
// gamma-table calculation... not working properly.
// for(var i=0; i<256; i++) {
//     gamma[i] = 0x80 | Math.floor( Math.pow( i / 255, 2.5) * 127 + 0.5);
// }

// lumi LEDS are GRB, not RGB - this is the mapping (GRB[0] <= RGB[1], GRB[1] <= RGB[0], GRB[2] <= RGB[2])
var colorOffsetMap = [1, 0, 2];

function openDevice(deviceName) {
    console.log('openDevice: ' + deviceName);
    stream = fs.createWriteStream(deviceName);
    stream.on('error', function(error) {
        console.error('Error on output stream: ', error);
        stream = null;
    });
}

function open() {
    // var deviceName = '/dev/spidev0.0';
    if(stream !== null) {
        stream.end(null,null,function() {
            openDevice(DEVICE);
        });
    } else {
        openDevice(DEVICE);
    }
}

function translateFrameForLedWall(data) {
  ///*DEBUG*/ debugOutFrame(data);

  // We need to shuffle data around as the 1st LED is frame[(32*31 + 31)*3]
  // (Rotated by 180° cw)
  var buffer = new Buffer( WIDTH * HEIGHT * 3 + ZEROS_NEEDED);
  buffer.fill(0x00);

  // Go through image (RGB) fill buffer (GRB) with gamma-fix
  // x0,y0 - top,left-corner => (wall rotated 180°cw) [0,0] => [31,0] => LED#1023
  // Image: [0,0] - top,left-corner
  // First-LED (LED#0) => Image[31,31]
  // Image[0,0] => LED#992 (y%2:0)
  // Image[31,0] => LED#1023 (y%2:0)
  // Image[0,31] => LED#31 (y%2:1)
  // Image[31,31] => LED#0 (y%2:1)
  // Image[0,30] => LED#32 (y%2:0)
  // Image[31,30] => LED#63 (y%2:0)

  var buffPos, imagePos;
  for(var y = 0; y < HEIGHT; y++) {
    for(var x = 0; x < WIDTH; x++) {
      imagePos = (y * WIDTH + x) * 3;
      if((y % 2) === 0) {
          // straight-segment - 1,3,5,7..31 - fill aligned with strip
        buffPos = (HEIGHT - 1 - y) * WIDTH + x;
      }
      else {
        // reverted-segment line - 0,2,4,6,8,...30
        buffPos = (HEIGHT - 1 - y) * WIDTH + (WIDTH - 1 - x);
      }
      buffPos *= 3;

      // transform RGB => GRB
      buffer[buffPos + 0] = gamma[data[imagePos + 1]];
      buffer[buffPos + 1] = gamma[data[imagePos + 0]];
      buffer[buffPos + 2] = gamma[data[imagePos + 2]];
    }
  }
  return buffer;
}

function sendFrame(data) {
  if (!(data instanceof Buffer) || data.length !== WIDTH * HEIGHT * 3) {
      console.log('sendFrame: Called with a frame I can\'t process. Size: ' + data.length);
      return;
  }

  if (stream === null) {
      open();
      return;
  }

  var buffer = translateFrameForLedWall(data);
  stream.write(buffer);
}

function setColor(buf, r, g, b) {
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      var pos = (y * WIDTH + x) * 3;
      buf[pos + 0] = r; // R
      buf[pos + 1] = g; // G
      buf[pos + 2] = b; // B
    }
  }
}

function reset() {
  var buffer = new Buffer(WIDTH * HEIGHT * 3);
  setColor(buffer, 0, 0, 0);
  sendFrame(buffer);
}

exports.openPort = open;
exports.sendFrame = sendFrame;
exports.reset = reset;
exports.setColor = setColor;


// function debugOutFrame(frame) {
//     console.log('New Frame:');
//     for(var y=0; y<HEIGHT; y++) {
//         var line = '';
//         for(var x=0; x<WIDTH; x++) {
//             var pos = ((y*WIDTH) + x) *3;
//             if(frame[pos] !== 0 || frame[pos + 1] !== 0 || frame[pos + 2] !== 0) {
//                 line = line + 'X';
//             }
//             else {
//                 line = line + ' ';
//             }
//         }
//         console.log(line);
//     }
// }


// Test-Code
var type = 0;
var idx = 0;
var colors = [[0x00,0xFF,0x00], [0xFF,0x00,0x00], [0x00,0x00,0xFF]];

reset();

var buffer = new Buffer(WIDTH * HEIGHT * 3);
function updateFrameLine() {
  var x, y, pos;

  buffer.fill(0);
  console.log('idx: ' + idx + ' type: ' + type);

  if(type === 0) {
    // Vertical line
    x = idx;
    for(y = 0; y < HEIGHT; y++) {
      pos = (y * WIDTH) + x;
      pos *= 3;
      buffer[pos + 0] = colors[idx%3][0];
      buffer[pos + 1] = colors[idx%3][1];
      buffer[pos + 2] = colors[idx%3][2];
    }
  }
  else {
    // Horizontal line
    y = idx;
    for(x = 0; x < WIDTH; x++) {
      pos = (y * WIDTH) + x;
      pos *= 3;
      buffer[pos + 0] = colors[idx%3][0];
      buffer[pos + 1] = colors[idx%3][1];
      buffer[pos + 2] = colors[idx%3][2];
    }
  }

  sendFrame(buffer);

  idx += 1;
  if(idx == WIDTH) {
      idx=0;
      type = (type === 0) ? 1 : 0;
  }
  setTimeout(updateFrameLine, 1);
}
// updateFrameLine();

var color = 0;
function blink() {
  color = (color === 0) ? 0xFF : 0x00;
  buffer.fill(color);
  sendFrame(buffer);
  setTimeout(blink, 500);
}
//blink();
