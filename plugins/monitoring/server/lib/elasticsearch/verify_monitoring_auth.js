import Boom from 'boom';

/*
 * Check the currently logged-in user's privileges for "read" privileges on the
 * monitoring data. Throws Boom.forbidden if the user fails the check, which
 * allows handleError to format the error properly for the UI.
 *
 * @param req {Object} the server route handler request object
 */
export async function verifyMonitoringAuth(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();

  const privilegesResult = await callWithRequest(req, 'transport.request', {
    method: 'POST',
    path: '_xpack/security/user/_has_privileges',
    body: {
      index: [
        {
          names: [ config.get('xpack.monitoring.index_pattern') ], // uses wildcard
          privileges: [ 'read' ]
        }
      ]
    }
  });

  if (!privilegesResult.has_all_requested) {
    throw Boom.forbidden();
  }
};
