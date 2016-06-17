const workerType = require('./constants').JOBTYPES_PRINTABLE_PDF;
const docJobProcessFactory = require('./doc_job_process');

module.exports = (server) => {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const docJobProcess = docJobProcessFactory(server);

  const workerOptions = {
    interval: queueConfig.pollInterval
  };

  const log = (msg) => {
    server.log(['reporting', 'worker', 'debug'], `${workerType}: ${msg}`);
  };

  const workerHandler = async (job) => {
    log(`Converting ${job.objects.length} saved object(s) to pdf`);
    const { contentType, buffer } = await docJobProcess(job);

    return {
      content_type: contentType,
      content: buffer.toString('base64')
    };
  };

  return function registerWorkers(queue) {
    log(`Registering worker`);
    const worker = queue.registerWorker(
      workerType,
      workerHandler,
      workerOptions
    );

    worker.on('error', (err) => {
      log(`Worker error: (${err})`);
    });

    worker.on('job_timeout', (err) => {
      log(`Job timeout exceeded (${err.timeout})`);
    });
  };
};
