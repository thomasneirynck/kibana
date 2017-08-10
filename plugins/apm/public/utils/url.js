import React from 'react';
import { connect } from 'react-redux';
import qs from 'querystring';
import { Link } from 'react-router-dom';
import _ from 'lodash';

export function toQuery(search) {
  return qs.parse(search.slice(1));
}

export function fromQuery(query) {
  return qs.stringify(query);
}

function RelativeLinkComponent({ location, path, query, ...props }) {
  // Shorthand for pathname
  const pathname = path || _.get(props.to, 'pathname') || location.pathname;

  // Add support for querystring as object
  const search =
    query || _.get(props.to, 'query')
      ? qs.stringify({
          ...toQuery(location.search),
          ...query,
          ..._.get(props.to, 'query')
        })
      : location.search;

  return (
    <Link {...props} to={{ ...location, ...props.to, pathname, search }} />
  );
}

const withLocation = connect(({ location }) => ({ location }), {});
export const RelativeLink = withLocation(RelativeLinkComponent);

// This is downright horrible 😭 💔
// Angular decodes encoded url tokens like "%2F" to "/" which causes the route to change.
// Has been fixed in Angular 1.4.10 and above: https://github.com/angular/angular.js/pull/13837
// The following methods can be removed when we get rid of Angular, or Angular is updated to a newer version (1.4.10 or higher)
export function legacyEncodeURIComponent(url) {
  return url && encodeURIComponent(url.replace(/\//g, '~2F'));
}

export function legacyDecodeURIComponent(url) {
  return url && decodeURIComponent(url.replace(/~2F/g, '/'));
}
