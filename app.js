'use strict';

/**
 * Module dependencies.
 */
var app = require('express')();
var http = require('http').Server(app);
var sketches = require('./routes/sketches');
var sketchRunner = require('./lumi/sketch_runner');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var morgan  = require('morgan');
var methodOverride = require('method-override');
var serveStatic = require('serve-static');
var errorhandler = require('errorhandler');

// Configuration
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.set('view options', {layout: false});
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan({ format: 'dev', immediate: true }));
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(serveStatic('public/'));
app.use(errorhandler());

//Routes
app.get('/', sketches.get);
app.get('/sketches', sketches.list(sketchRunner));
app.get('/sketches/:name', sketches.get);
app.delete('/sketches/:name', sketches.delete);
app.get('/remotes', sketches.remotes(sketchRunner));
app.get('/play/:name',sketches.play);
//upsert
app.post('/sketches', sketches.upsert);

http.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
