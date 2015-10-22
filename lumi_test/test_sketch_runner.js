sketchRunner = require('../lib/sketch_runner.js');
sketchRunner.addListener(function(name,state,id) {
  console.log("name: " + name + " state:" + state + " id:" + id);
});

sketchRunner.runSketch("SimplePlasma", "http://localhost:3000/play/SimplePlasma");

setTimeout(function(){
  console.log("stopping SimplePlasma..");

  sketchRunner.stopSketchByName("SimplePlasma");

  console.log("running two");
  sketchRunner.runSketch("SimplePlasma", "http://localhost:3000/play/SimplePlasma");
  sketchRunner.runSketch("SimplePlasma", "http://localhost:3000/play/SimplePlasma");

  setTimeout(function(){
    console.log("stopping (hopefully) two...");
    sketchRunner.stopSketchByName("SimplePlasma");
  }, 5000);
}, 5000);
