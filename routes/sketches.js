
var db = require('../lib/db')();

exports.upsert = function (req, res) {

  var name   = req.param('name', false)
    , code = req.param('code');

  if (!name) { return res.json({success: false, error: 'missing params: `name`'}); }

  db.sketches.upsert(name, code, function (err) {
    if (err) {
      res.json({success: false, error: err.message});
    } else {
      res.json({success: true});
    }
  });

};

exports.list = function(req, res){

  db.sketches.all(function (err, sketches) {
    if (err) { throw err; }
    res.render('./list', {sketches: sketches});
  });

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