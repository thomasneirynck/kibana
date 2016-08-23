import Boom from 'boom';
import Promise from 'bluebird';
import { contains, get } from 'lodash';

/**
 * Creates a hapi authenticate function that conditionally
 * redirects on auth failure
 *
 * Kibana requires the `kbn-version` header for xhr requests, so it is probably
 * the safest measure we have for determining whether a request should return a
 * 401 or a 302 when authentication fails.
 *
 * @param {object}
 *    onError:     Transform function that error is passed to before deferring
 *                 to standard error handler
 *    redirectUrl: Transform function that request path is passed to before
 *                 redirecting
 *    strategy:    The name of the auth strategy to use for test, or an array of auth strategy names
 *    testRequest: Function to test authentication for a request
 * @return {Function}
 */
export default function factory({ redirectUrl, strategies, testRequest, xpackMainPlugin, clientCookieName }) {
  const testRequestAsync = Promise.promisify(testRequest);
  return function authenticate(request, reply) {
    // If security is disabled, continue with no user credentials and delete the client cookie as well
    const xpackInfo = xpackMainPlugin && xpackMainPlugin.info;
    if (xpackInfo && xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled()) {
      if (request.state[clientCookieName]) {
        reply.unstate(clientCookieName);
      }
      reply.continue({ credentials: {} });
      return;
    }

    // Test the request against all of the authentication strategies and if any succeed, continue
    return Promise.any(strategies.map((strategy) => testRequestAsync(strategy, request)))
    .then((credentials) => reply.continue({ credentials }))
    .catch(() => {
      if (shouldRedirect(request)) {
        reply.redirect(redirectUrl(request.url.path));
      } else {
        reply(Boom.unauthorized());
      }
    });
  };
};

export function shouldRedirect(request) {
  const isApiRoute = contains(request.route.settings.tags, 'api');
  const isAjaxRequest = Boolean(get(request.raw.req.headers, 'kbn-version'));

  return !isApiRoute && !isAjaxRequest;
};
