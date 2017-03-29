import getClient from '../get_client_ml';
import { wrapError } from '../errors';

export default (server, commonRouteConfig) => {
  const callWithRequest = getClient(server).callWithRequest;

  server.route({
    method: 'GET',
    path: '/api/ml/anomaly_detectors',
    handler(request, reply) {
      return callWithRequest(request, 'ml.jobs')
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/anomaly_detectors/{jobId}',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.jobs', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/anomaly_detectors/_stats',
    handler(request, reply) {
      return callWithRequest(request, 'ml.jobStats')
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'GET',
    path: '/api/ml/anomaly_detectors/{jobId}/_stats',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.jobStats', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/ml/anomaly_detectors/{jobId}',
    handler(request, reply) {
      const jobId = request.params.jobId;
      const body = request.payload;
      return callWithRequest(request, 'ml.addJob', {jobId, body})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/anomaly_detectors/{jobId}/_update',
    handler(request, reply) {
      const jobId = request.params.jobId;
      const body = request.payload;
      return callWithRequest(request, 'ml.updateJob', {jobId, body})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/anomaly_detectors/{jobId}/_open',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.openJob', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/anomaly_detectors/{jobId}/_close',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.closeJob', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/ml/anomaly_detectors/{jobId}',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.deleteJob', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'UPDATE',
    path: '/api/ml/anomaly_detectors/{jobId}',
    handler(request, reply) {
      const jobId = request.params.jobId;
      return callWithRequest(request, 'ml.deleteJob', {jobId})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

  server.route({
    method: 'POST',
    path: '/api/ml/anomaly_detectors/_validate/detector',
    handler(request, reply) {
      const body = request.payload;
      return callWithRequest(request, 'ml.validateDetector', {body})
      .then(resp => reply(resp))
      .catch(resp => reply(wrapError(resp)));
    },
    config: {
      ...commonRouteConfig
    }
  });

};
