
var mongo = require('mongoskin')
  , conf  = require('./config')()
  , api = { sketches: {}}
  , db;

/* API */
api.sketches.upsert = function (name, sketch, cb) {
  db.sketches.update({name: name}, { $set: {name: name, sketch: sketch}}, {upsert: true}, cb);
};

api.sketches.all = function (cb) {
  db.sketches.find({}).toArray(cb);
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
