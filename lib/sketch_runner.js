var util = require('util');
var phantom = require('phantom');

var listeners = [];
var runningSketches = [];

var uniqueIdCounter = 1;

exports.addListener = function(cb){
  listeners.push(cb);
};

function notify(name, state, id) {
  listeners.forEach(function(cb){
    cb(name,state, id);
  });
}

exports.runSketch = function(name, playUrl) {
  /* DEBUG */console.log("Running sketch '" + name + "' from " + playUrl);
  phantom.create(function(ph) {
    ph.createPage(function(page){
      page.open(playUrl, function(status){
        /* DEBUG */console.log("loading state: " + status);
        if(status == "success") {
          /* DEBUG */console.log("loading skecht succeded!");
          var id = uniqueIdCounter++;

          runningSketches.push({
            id: id,
            name: name,
            sketch: ph
          });

          notify(name, 'running', id);
        }
      });
    });
  });
};

exports.stopSketchByName = function(name){
  /*DEBUG*/console.log("stopping all sketches with name '" + name + "'");
  runningSketches = runningSketches.filter(function (entry){
    if(entry.name == name) {
      entry.sketch.exit();
      notify(name,'stopped', entry.id);
      return false;
    }
    return true;
  });
};

exports.stopSketchById = function(id){
  /*DEBUG*/console.log("stopping sketch with id '" + id + "'");
  runningSketches = runningSketches.filter(function (entry){
    if(entry.id == id) {
      entry.sketch.exit();
      notify(entry.name,'stopped', entry.id);
      return false;
    }
    return true;
  });
};

exports.stopAll = function(){
  console.log("stopping all sketches..");
  runningSketches.forEach(function(entry){
    entry.sketch.exit();
    notify(entry.name,'stopped',entry.id);
  });
};
