'use strict';

import React         from 'react/addons';
import {Link}        from 'react-router';
import DocumentTitle from 'react-document-title';

import LikeButton from '../components/like';

const HomePage = React.createClass({

  propTypes: {
    currentUser: React.PropTypes.object.isRequired
  },

  render() {
    return (
      <DocumentTitle title="Home">
        <section className="home-page">

          <LikeButton />

          <div>
            Home
          </div>

          <div>
            <Link to="/search">Search</Link>
          </div>

        </section>
      </DocumentTitle>
    );
  }

});

export default HomePage;
