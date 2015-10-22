'use strict';

import React         from 'react/addons';
import {Link}        from 'react-router';
import DocumentTitle from 'react-document-title';
import RaisedButton  from 'material-ui/lib/raised-button';

const SearchPage = React.createClass({

  propTypes: {
    currentUser: React.PropTypes.object.isRequired
  },

  render() {
    return (
      <DocumentTitle title="Lumi">
        <section className="lumi-page">

          <div>
            Lumi
          </div>

          <RaisedButton labe="Test start" />
          <RaisedButton labe="Reset Lumi" />

          <div>
            <Link to="/">Back to Home</Link>
          </div>

        </section>
      </DocumentTitle>
    );
  }

});

export default SearchPage;
