const esqueueEvents = require('esqueue/lib/constants/events');
const { JOBTYPES } = require('./constants');
const workersFactory = require('./workers');
const oncePerServer = require('./once_per_server');

function createWorkersFactory(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const workers = workersFactory(server);

  // Once more document types are added, this will need to be passed in
  return function registerWorkers(queue) {

    const workerTypes = [
      JOBTYPES.PRINTABLE_PDF
    ];

    workerTypes.forEach((workerType) => {
      const log = (msg) => {
        server.log(['reporting', 'worker', 'debug'], `${workerType}: ${msg}`);
      };

      log(`Registering ${workerType} worker`);
      const workerFn = workers[workerType];
      const workerOptions = {
        interval: queueConfig.pollInterval
      };
      const worker = queue.registerWorker(workerType, workerFn, workerOptions);

      worker.on(esqueueEvents.EVENT_WORKER_COMPLETE, (res) => log(`Worker completed: (${res.job.id})`));
      worker.on(esqueueEvents.EVENT_WORKER_JOB_EXECUTION_ERROR, (res) => log(`Worker error: (${res.job.id})`));
      worker.on(esqueueEvents.EVENT_WORKER_JOB_TIMEOUT, (res) => log(`Job timeout exceeded: (${res.job.id})`));
    });
  };
};

module.exports = oncePerServer(createWorkersFactory);
