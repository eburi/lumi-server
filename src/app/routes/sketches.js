'use strict';

var db = require('../lib/db')();


exports.upsert = function (req, res) {

  var sketch = req.param('sketch');

  if (!sketch.name) { return res.json({success: false, error: 'missing params: `sketch.name`'}); }

  db.sketches.upsert(sketch, function (err) {
    if (err) {
      res.json({success: false, error: err.message});
    } else {
      res.json({success: true});
    }
  });
};

exports.list = function(sketchRunner) {
  return function(req, res) {
    db.sketches.all(function (err, sketches) {
      if (err) {
        // this crashed the node process...
        throw err;
      }
      res.render('./list', {sketches: sketches});
    });
  };

};

exports.get = function (req, res) {

  var name = req.param('name', false);

  if (name) {
    //try to load sketch
    db.sketches.get(name, function (err, sketch) {
      res.render('./editor', {sketch: sketch});
    });
  } else {
    res.render('./editor', {sketch: {}});
  }

};

exports.delete = function (req, res) {

  var name = req.param('name', false);

  if(!name) { return res.json({success: false, error: 'missing params: `name`'}); }

  db.sketches.delete(name, function (err) {
    if (err) { throw new Error('could not delete sketch: ' + name + ', error: ' + err);}

    return res.json({success: true});

  });

};

exports.play = function(req,res) {
  var name = req.param('name', false);
  if(name){
    //try to load sketch
    db.sketches.get(name, function (err, sketch) {
      res.render('./player', {sketch: sketch});
    });
  }
};

exports.remotes = function(sketchRunner) {
  return function(req, res) {
    var running = sketchRunner.getAllSketches();
    res.render('./remotes', {running: running});
  };
};
