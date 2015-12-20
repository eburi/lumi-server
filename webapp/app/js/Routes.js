'use strict';

import React                       from 'react/addons';
import {Router, Route, IndexRoute} from 'react-router';
import CreateBrowserHistory        from 'history/lib/createBrowserHistory';

import App                         from './App';
import HomePage                    from './pages/HomePage';
import SearchPage                  from './pages/SearchPage';
import LumiPage                    from './pages/LumiPage';
import NotFoundPage                from './pages/NotFoundPage';

export default (
  <Router history={CreateBrowserHistory()}>
    <Route path="/" component={App}>

      <IndexRoute component={HomePage} />

      <Route path="/" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/lumi" component={LumiPage} />

      <Route path="*" component={NotFoundPage} />

    </Route>
  </Router>
);
