/*
 * A route to provide detailed XPack license info for the production cluster
 * that needs to exposed in the UI for user awareness.
 * Will use the authentication credentials supplied by the browser request
 */
import { get, pick } from 'lodash';
export default function xpackLicenseRoute(server) {
  const createClient = server.plugins.elasticsearch.createClient;
  const client = createClient({ auth: false });
  server.route({
    method: 'GET',
    path: '/api/xpack/v1/license',
    handler: (req, reply) => {
      const username = get(req, 'auth.credentials.username');
      const password = get(req, 'auth.credentials.password');
      const auth = new Buffer(`${username}:${password}`).toString('base64');
      client.transport.request({
        method: 'GET',
        headers: { authorization: `Basic ${auth}` },
        path: '_xpack'
      })
      .then(response => {
        return reply({
          ...pick(response.license, ['mode', 'status', 'expiry_date_in_millis'])
        });
      });
    }
  });
}
/* Example response:
{
  "mode": "trial",
  "status": "active",
  "expiry_date_in_millis": 1464218386344
} */
