'use strict';

import injectTapEventPlugin from 'react-tap-event-plugin';
//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

import ReactDOM from 'react-dom';

import Routes from './Routes';

if ( process.env.NODE_ENV !== 'production' ) {
  // Enable React devtools
  window.ReactDOM = ReactDOM;
}

ReactDOM.render(Routes, document.getElementById('app'));
