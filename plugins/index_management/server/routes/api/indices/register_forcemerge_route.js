import { callWithRequestFactory } from '../../../lib/call_with_request_factory';
import { isEsErrorFactory } from '../../../lib/is_es_error_factory';
import { wrapEsError, wrapUnknownError } from '../../../lib/error_wrappers';
import { licensePreRoutingFactory } from'../../../lib/license_pre_routing_factory';

function getIndexArrayFromPayload(payload) {
  return payload.indices || [];
}

async function forcemergeIndices(callWithRequest, indices) {
  const params = {
    ignoreUnavailable: true,
    allowNoIndices: false,
    expandWildcards: 'none',
    index: indices
  };

  return await callWithRequest('indices.forcemerge', params);
}

export function registerForcemergeRoute(server) {
  const isEsError = isEsErrorFactory(server);
  const licensePreRouting = licensePreRoutingFactory(server);

  server.route({
    path: '/api/index_management/indices/forcemerge',
    method: 'POST',
    handler: async (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);
      const indices = getIndexArrayFromPayload(request.payload);

      try {
        await forcemergeIndices(callWithRequest, indices);

        //TODO: Should we check acknowledged = true?
        reply();
      } catch (err) {
        if (isEsError(err)) {
          return reply(wrapEsError(err));
        }

        reply(wrapUnknownError(err));
      }
    },
    config: {
      pre: [ licensePreRouting ]
    }
  });
}
