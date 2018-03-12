import { setCollectionEnabled } from '../../../../../lib/elasticsearch_settings';
import { handleSettingsError } from '../../../../../lib/errors';

/*
 * Cluster Settings Check Route
 */
export function setCollectionEnabledRoute(server) {
  server.route({
    method: 'PUT',
    path: '/api/monitoring/v1/elasticsearch_settings/set/collection_enabled',
    config: {
      validate: {}
    },
    async handler(req, reply) {
      try {
        const response = await setCollectionEnabled(req);
        reply(response);
      } catch (err) {
        reply(handleSettingsError(err));
      }
    }
  });
}

