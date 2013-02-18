
var db = require('../lib/db')();

exports.upsert = function (req, res) {

  var name   = req.param('name', false)
    , sketch = req.param('sketch');

  if (!name) { throw new Error('missing params: `name`');}

  db.sketches.upsert(name, sketch, function (err) {
    if (err) {
      res.json({success: false, error: err.message});
    } else {
      res.json({success: true});
    }
  });

};

exports.list = function(req, res){

  db.sketches.all(function (err, sketches) {
    if (err) {
      res.json({success: false, error: err.message});
    } else {
      res.json({success: true, data: sketches});
    }
  });

};