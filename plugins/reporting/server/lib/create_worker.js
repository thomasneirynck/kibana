const esqueueEvents = require('esqueue/lib/constants/events');
const constants = require('./constants');
const docJobProcessFactory = require('./doc_job_process');
const oncePerServer = require('./once_per_server');

function createWorkerFactory(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const docJobProcess = docJobProcessFactory(server);

  // Once more document types are added, this will need to be passed in
  return function registerWorker(queue, workerType = constants.JOBTYPES_PRINTABLE_PDF) {
    const workerOptions = {
      interval: queueConfig.pollInterval
    };

    const log = (msg) => {
      server.log(['reporting', 'worker', 'debug'], `${workerType}: ${msg}`);
    };

    const workerHandler = async (job) => {
      log(`Converting ${job.objects.length} saved object(s) to ${workerType}`);
      const { contentType, buffer } = await docJobProcess(job);

      return {
        content_type: contentType,
        content: buffer.toString('base64')
      };
    };

    log(`Registering worker`);
    const worker = queue.registerWorker(
      workerType,
      workerHandler,
      workerOptions
    );

    worker.on(esqueueEvents.EVENT_WORKER_COMPLETE, (res) => log(`Worker completed: (${res.job.id})`));
    worker.on(esqueueEvents.EVENT_WORKER_JOB_EXECUTION_ERROR, (res) => log(`Worker error: (${res.job.id})`));
    worker.on(esqueueEvents.EVENT_WORKER_JOB_TIMEOUT, (res) => log(`Job timeout exceeded: (${res.job.id})`));
  };
};

module.exports = oncePerServer(createWorkerFactory);
