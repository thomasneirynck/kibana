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
 *    strategy:    The name of the auth strategy to use for test
 *    testRequest: Function to test authentication for a request
 * @return {Function}
 */
export default function factory({ onError, redirectUrl, strategy, testRequest, xpackInfo }) {
  return function authenticate(request, reply) {
    // If security is disabled, continue with no user credentials
    if (xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled()) {
      reply.continue({ credentials: {} });
      return;
    }

    testRequest(strategy, request, (err, credentials) => {
      if (err) {
        if (shouldRedirect(request.raw.req)) {
          reply.redirect(redirectUrl(request.url.path));
        } else {
          reply(onError(err));
        }
      } else {
        reply.continue({ credentials });
      }
    });
  };
};

export function shouldRedirect(req) {
  return !req.headers['kbn-version'];
};
