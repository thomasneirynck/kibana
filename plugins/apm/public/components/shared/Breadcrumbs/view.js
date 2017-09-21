import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import {
  legacyDecodeURIComponent,
  toQuery,
  fromQuery
} from '../../../utils/url';
import _ from 'lodash';

const getTokenized = pathname => {
  const paths = ['/'];

  if (pathname === '/') return paths;

  pathname.split('/').reduce((prev, curr) => {
    const currPath = `${prev}/${curr}`;
    paths.push(currPath);
    return currPath;
  });

  return paths;
};

export const _routes = {
  '/': 'APM',
  '/:appName/errors': 'Errors',
  '/:appName/errors/:groupId': params => params.groupId,
  '/:appName': {
    url: params => `/${params.appName}/transactions`,
    label: params => params.appName
  },
  '/:appName/transactions/:transactionType': params => params.transactionType,
  '/:appName/transactions/:transactionType/:transactionName': params =>
    legacyDecodeURIComponent(params.transactionName)
};

export function getBreadcrumbs({ match, routes }) {
  const patterns = getTokenized(match.path);
  const urlTokens = getTokenized(match.url);

  return patterns
    .map((pattern, i) => ({
      pattern,
      urlToken: urlTokens[i]
    }))
    .filter(({ pattern }) => {
      return routes[pattern];
    })
    .map(({ pattern, urlToken }) => {
      const routePattern = routes[pattern];
      const labelOrHandler = _.get(routePattern, 'label') || routePattern;
      const label = _.isString(labelOrHandler)
        ? labelOrHandler
        : labelOrHandler(match.params);

      const urlOrHandler = _.get(routePattern, 'url') || urlToken;
      const url = _.isString(urlOrHandler)
        ? urlOrHandler
        : urlOrHandler(match.params);

      return { label, url };
    });
}

function Breadcrumbs({ match, location }) {
  const breadcrumbs = getBreadcrumbs({ match, routes: _routes });

  if (_.isEmpty(breadcrumbs)) {
    return null;
  }

  const { _g } = toQuery(location.search);
  const search = fromQuery({ _g });

  return (
    <div className="Breadcrumbs">
      <div className="kuiLocalNavRow">
        <div className="kuiLocalNavRow__section">
          <div className="kuiLocalBreadcrumbs">
            {breadcrumbs.map(breadcrumb => (
              <div key={breadcrumb.url} className="kuiLocalBreadcrumb">
                <Link
                  className="kuiLink"
                  to={{ pathname: breadcrumb.url, search }}
                >
                  {breadcrumb.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(Breadcrumbs);
