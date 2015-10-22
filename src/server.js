'use strict';

var express = require('express');
var path = require('path');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

require('./lumi-socket-adapter')(io);

var port = process.env.PORT || 3000;

// Make sure to include the JSX transpiler
require('node-jsx').install();

// Include static assets. Not advised for production
app.use(express.static(path.join(__dirname, '../public')));

// Set view path
app.set('views', path.join(__dirname, 'views'));

// set up ejs for templating. You can use whatever
app.set('view engine', 'hjs');

// Set up Routes for the application
require('../app/routes/core-routes.js')(app);

//Route not found -- Set 404
app.get('*', function(req, res) {
    res.json({
        'route': 'Sorry this page does not exist!'
    });
});

app.listen(port);
console.log('Server is Up and Running at Port : ' + port);