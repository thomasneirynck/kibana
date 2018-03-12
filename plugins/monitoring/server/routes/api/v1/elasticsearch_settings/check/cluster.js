import { checkClusterSettings } from '../../../../../lib/elasticsearch_settings';
import { handleSettingsError } from '../../../../../lib/errors';

/*
 * Cluster Settings Check Route
 */
export function clusterSettingsCheckRoute(server) {
  server.route({
    method: 'GET',
    path: '/api/monitoring/v1/elasticsearch_settings/check/cluster',
    config: {
      validate: {}
    },
    async handler(req, reply) {
      try {
        const response = await checkClusterSettings(req); // needs to be try/catch to handle privilege error
        reply(response);
      } catch (err) {
        reply(handleSettingsError(err));
      }
    }
  });
}
