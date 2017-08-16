import React from 'react';
import { withRouter } from 'react-router-dom';
import { RelativeLink, legacyDecodeURIComponent } from '../../../utils/url';
import _ from 'lodash';

const getPaths = pathname => {
  const paths = ['/'];

  if (pathname === '/') return paths;

  pathname.split('/').reduce((prev, curr) => {
    const currPath = `${prev}/${curr}`;
    paths.push(currPath);
    return currPath;
  });

  return paths;
};

const routes = {
  '/': 'APM',
  '/:appName/settings': 'Settings',
  '/:appName/errors': 'Errors',
  '/:appName/errors/:groupingId': params => params.groupingId,
  '/:appName': params => params.appName,
  '/:appName/transactions/:transactionType': params => params.transactionType,
  '/:appName/transactions/:transactionType/:transactionName': params =>
    legacyDecodeURIComponent(params.transactionName)
};

function getBreadcrumbs({ match, location }) {
  const matchedPaths = getPaths(match.path);
  const urls = getPaths(location.pathname);

  return matchedPaths.filter(path => routes[path]).map((path, i) => {
    const url = urls[i];
    const name = _.isString(routes[path])
      ? routes[path]
      : routes[path](match.params);

    return { name, url };
  });
}

function Breadcrumbs({ match, location }) {
  const breadcrumbs = getBreadcrumbs({ match, location });

  if (_.isEmpty(breadcrumbs)) {
    return null;
  }

  return (
    <div className="Breadcrumbs">
      <div className="kuiLocalNavRow">
        <div className="kuiLocalNavRow__section">
          <div className="kuiLocalBreadcrumbs">
            {breadcrumbs.map(breadcrumb =>
              <div key={breadcrumb.url} className="kuiLocalBreadcrumb">
                <RelativeLink path={breadcrumb.url}>
                  {breadcrumb.name}
                </RelativeLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Breadcrumbs);
