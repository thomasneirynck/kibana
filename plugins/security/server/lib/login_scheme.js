import { authenticateFactory } from './auth_redirect';

/**
 * Creates a hapi auth scheme with conditional session
 * expiration handling based on each request
 *
 * @param {object}
 *    redirectUrl: Transform function that request path is passed to before
 *                 redirecting.
 * @return {Function}
 */
export function createScheme({ redirectUrl }) {
  return (server) => {
    return { authenticate: authenticateFactory({ redirectUrl, server }) };
  };
}
