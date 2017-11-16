import { handleError } from '../../../../../monitoring/server/lib/errors';
import { getUsageCollector, getReportingCollector } from '../../../../../monitoring/server/kibana_monitoring';

export function kibanaStatsRoute(server) {
  server.route({
    path: '/api/_kibana/v1/stats',
    method: 'GET',
    handler: async (req, reply) => {

      try {
        const kibanaUsageCollector = getUsageCollector(req.server, req.server.config());
        const reportingCollector = getReportingCollector(req.server, req.server.config());

        const [ kibana, reporting ] = await Promise.all([
          kibanaUsageCollector.fetch(),
          reportingCollector.fetch(),
        ]);

        reply({
          kibana,
          reporting,
        });
      } catch(err) {
        reply(handleError(err, req));
      }

    }
  });
}
