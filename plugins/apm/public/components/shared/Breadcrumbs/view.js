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

const _routes = {
  '/': 'APM',
  '/:appName/errors': 'Errors',
  '/:appName/errors/:groupingId': params => params.groupingId,
  '/:appName': params => params.appName,
  '/:appName/transactions/:transactionType': params => params.transactionType,
  '/:appName/transactions/:transactionType/:transactionName': params =>
    legacyDecodeURIComponent(params.transactionName)
};

export function getBreadcrumbs({ match, routes }) {
  const patterns = getPaths(match.path);
  const urls = getPaths(match.url);

  return patterns
    .map((pattern, i) => ({
      pattern,
      url: urls[i]
    }))
    .filter(item => routes[item.pattern])
    .map(({ pattern, url }) => {
      const label = _.isString(routes[pattern])
        ? routes[pattern]
        : routes[pattern](match.params);

      return { label, url };
    });
}

function Breadcrumbs({ match }) {
  const breadcrumbs = getBreadcrumbs({ match, routes: _routes });

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
                  {breadcrumb.label}
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
