'use strict';

var React = require('react/addons'),
ReactApp = React.createFactory(require('../components/ReactApp'));

module.exports = function(app) {

	app.get('/', function(req, res){
		// React.renderToString takes your component
    // and generates the markup
		var reactHtml = React.renderToString(ReactApp({}));
    // Output html rendered by react
		console.log('The server rendered HTML:\n' + reactHtml);

    res.render('index.hjs', {reactOutput: reactHtml});
	});
};
