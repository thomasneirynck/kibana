import { EVENT_WORKER_COMPLETE, EVENT_WORKER_JOB_FAIL } from 'esqueue/lib/constants/events';
import oncePerServer from './once_per_server';
import workersFactory from './workers';

function getDocumentPayloadFactory(server) {
  const jobQueue = server.plugins.reporting.queue;
  const workers = workersFactory(server);

  function encodeContent(content, jobType) {
    if (!jobType) {
      return content;
    }

    const worker = workers[jobType];
    switch (worker.encoding) {
      case 'base64':
        return new Buffer(content, 'base64');
      default:
        return content;
    }
  }

  function formatJobOutput(output, statusCode, jobType) {
    const content = encodeContent(output.content, jobType);
    const contentType = output.content_type;
    return { content, statusCode, contentType };
  }

  function getDocumentPayload(doc, jobType) {
    const { status, output } = doc._source;

    return new Promise((resolve, reject) => {
      if (status === 'completed') {
        resolve(formatJobOutput(output, 200, jobType));
      }

      if (status === 'failed') {
        reject(formatJobOutput(output, 204));
      }

      // wait for the job to be completed
      function sendPayload(completed) {
        // if the completed job matches this job
        if (completed.job.id === doc._id) {
          // remove event listener
          cleanupListeners();
          resolve(formatJobOutput(completed.output, 200, jobType));
        }
      };

      function errorHandler(err) {
        // remove event listener
        cleanupListeners();
        reject(formatJobOutput(err.output, 504));
      };

      function cleanupListeners() {
        jobQueue.removeListener(EVENT_WORKER_COMPLETE, sendPayload);
        jobQueue.removeListener(EVENT_WORKER_JOB_FAIL, errorHandler);
      }

      jobQueue.on(EVENT_WORKER_COMPLETE, sendPayload);
      jobQueue.on(EVENT_WORKER_JOB_FAIL, errorHandler);
    });
  };

  return getDocumentPayload;
}

export default oncePerServer(getDocumentPayloadFactory);
