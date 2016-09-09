import boom from 'boom';
import oncePerServer from './once_per_server';
import jobsQueryFactory from './jobs_query';
import getJobPayloadFactory from './get_document_payload';

function syncJobHandlerFactory(server) {
  const jobsQuery = jobsQueryFactory(server);
  const getJobPayload = getJobPayloadFactory(server);

  return function syncJobHandler(jobId, jobType, request, reply) {
    jobsQuery.get(request, jobId, true)
    .then((doc) => {
      if (!doc) return reply(boom.notFound());

      return getJobPayload(doc, jobType)
      .then((output) => {
        const response = reply(output.content);
        response.type(output.contentType);
      })
      .catch((err) => {
        if (err.statusCode === 204) return reply().code(err.statusCode);
        if (err.statusCode === 504) return reply(boom.gatewayTimeout(`Report generation failed: ${err.content}`));
        reply(boom.badImplementation());
      });
    });
  };
}

export default oncePerServer(syncJobHandlerFactory);
