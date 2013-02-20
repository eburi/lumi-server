
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

exports.list = function(lumi) {
  return function(req, res) {
    var rSketches = lumi.getRunningSketches();

    db.sketches.all(function (err, sketches) {
      if (err) { throw err; }
      res.render('./list', {sketches: sketches});
    });

  }
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
