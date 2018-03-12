import { setCollectionInterval } from '../../../../../lib/elasticsearch_settings';
import { handleSettingsError } from '../../../../../lib/errors';

/*
 * Cluster Settings Check Route
 */
export function setCollectionIntervalRoute(server) {
  server.route({
    method: 'PUT',
    path: '/api/monitoring/v1/elasticsearch_settings/set/collection_interval',
    config: {
      validate: {}
    },
    async handler(req, reply) {
      try {
        const response = await setCollectionInterval(req);
        reply(response);
      } catch (err) {
        reply(handleSettingsError(err));
      }
    }
  });
}
