import Boom from 'boom';
import Promise from 'bluebird';

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
export default function factory({ redirectUrl, strategy, testRequest }) {
  return function authenticate(request, reply) {
    const strategies = Array.isArray(strategy) ? strategy : [strategy];
    const testRequestPromise = Promise.promisify(testRequest);

    // Test the request against all of the authentication strategies and if any succeed, continue
    Promise.any(strategies.map((strat) => testRequestPromise(strat, request)))
    .then((credentials) => reply.continue({ credentials }))
    .catch(() => {
      if (shouldRedirect(request.raw.req)) {
        reply.redirect(redirectUrl(request.url.path));
      } else {
        // The strategies will be comma-separated and set to the 'WWW-Authenticate' header
        reply(Boom.unauthorized(null, strategies));
      }
    });
  };
};

export function shouldRedirect(req) {
  return !req.headers['kbn-version'];
};
