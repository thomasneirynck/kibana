import Boom from 'boom';
import { contains, get, has } from 'lodash';

const ROUTE_TAG_API = 'api';
const KIBANA_XSRF_HEADER = 'kbn-xsrf';
const KIBANA_VERSION_HEADER = 'kbn-version';

/**
 * Creates a hapi authenticate function that conditionally
 * redirects on auth failure
 *
 * Kibana requires a `kbn-xsrf` header or a `kbn-version` for xhr requests, so
 * it is probably the safest measure we have for determining whether a request
 * should return a 401 or a 302 when authentication fails.
 *
 * @param {Object} options
 * @property {string} redirectUrl Transform function that request path is passed to before
 * redirecting
 * @property {Hapi.Server} HapiJS Server instance.
 *
 * @return {Function}
 */
export function authenticateFactory({ redirectUrl, server }) {
  return async function authenticate(request, reply) {
    // If security is disabled or license is basic, continue with no user credentials and delete the client cookie as well
    const xpackInfo = server.plugins.xpack_main.info;
    if (xpackInfo.isAvailable()
        && (!xpackInfo.feature('security').isEnabled() || xpackInfo.license.isOneOf('basic'))) {
      reply.continue({ credentials: {} });
      return;
    }

    try {
      const authenticationResult = await server.plugins.security.authenticate(request);
      if (authenticationResult.succeeded()) {
        reply.continue({ credentials: authenticationResult.user });
        return;
      }
    } catch(err) {
      server.log(['error', 'authentication'], err);
    }

    if (shouldRedirect(request)) {
      reply.redirect(redirectUrl(request.url.path));
    } else {
      reply(Boom.unauthorized());
    }
  };
}

export function shouldRedirect(request) {
  const hasVersionHeader = has(request.raw.req.headers, KIBANA_VERSION_HEADER);
  const hasXsrfHeader = has(request.raw.req.headers, KIBANA_XSRF_HEADER);

  const isApiRoute = contains(get(request, 'route.settings.tags'), ROUTE_TAG_API);
  const isAjaxRequest = hasVersionHeader || hasXsrfHeader;

  return !isApiRoute && !isAjaxRequest;
}
