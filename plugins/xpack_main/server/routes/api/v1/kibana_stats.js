import { handleError } from '../../../../../monitoring/server/lib/errors';
import { getUsageCollector } from '../../../../../monitoring/server/kibana_monitoring';

export function kibanaStatsRoute(server) {
  server.route({
    path: '/api/_kibana/v1/stats',
    method: 'GET',
    handler: async (req, reply) => {

      try {
        const kibanaUsageCollector = getUsageCollector(req.server, req.server.config());
        reply({
          kibana: await kibanaUsageCollector.fetch()
        });
      } catch(err) {
        reply(handleError(err, req));
      }

    }
  });
}
