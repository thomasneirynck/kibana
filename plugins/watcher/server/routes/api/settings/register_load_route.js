import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { isEsErrorFactory } from '../../../lib/is_es_error_factory';
import { wrapEsError, wrapUnknownError } from '../../../lib/error_wrappers';
import { licensePreRoutingFactory } from'../../../lib/license_pre_routing_factory';
import { Settings } from '../../../models/settings';

function fetchClusterSettings(callWithRequest) {
  return callWithRequest('cluster.getSettings', {
    includeDefaults: true,
    filterPath: '**.xpack.notification'
  });
}

export function registerLoadRoute(server) {
  const isEsError = isEsErrorFactory(server);
  const licensePreRouting = licensePreRoutingFactory(server);

  server.route({
    path: '/api/watcher/settings',
    method: 'GET',
    handler: (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);

      return fetchClusterSettings(callWithRequest)
      .then((settings) => {
        reply(Settings.fromUpstreamJSON(settings).downstreamJSON);
      })
      .catch(err => {

        // Case: Error from Elasticsearch JS client
        if (isEsError(err)) {
          return reply(wrapEsError(err));
        }

        // Case: default
        reply(wrapUnknownError(err));
      });
    },
    config: {
      pre: [ licensePreRouting ]
    }
  });
}