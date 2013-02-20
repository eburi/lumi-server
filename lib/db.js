
var mongo = require('mongoskin')
  , conf  = require('./config')()
  , api = { sketches: {}}
  , db;

/* API */
api.sketches.upsert = function (sketch, cb) {
  var update = {
    $set: {
        name: sketch.name
      , desc: sketch.desc
      , code: sketch.code
    }
  };
  db.sketches.update({name: sketch.name}, update, {upsert: true}, cb);
};

api.sketches.all = function (cb) {
  db.sketches.find({}).toArray(cb);
};

api.sketches.get = function (name, cb) {
  db.sketches.findOne({name: name}, cb);
};

api.sketches.delete = function (name, cb) {
  db.sketches.remove({name:name}, cb);
};

module.exports = function () {

  if (db) {
    //already initialized, so just return it.
    return api;
  }

  if (!conf.dbUrl) { throw new Error('conf.dbUrl required'); }
  db = mongo.db(conf.dbUrl + '?auto_reconnect', {safe: false});

  db.bind('sketches');

  return api;

};
