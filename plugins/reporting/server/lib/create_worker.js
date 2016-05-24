var constants = require('./constants');

module.exports = (server) => {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const generateDocument = server.plugins.reporting.generateDocument;

  return function registerWorkers(queue) {
    const workerType = constants.JOBTYPES_PRINTABLE_PDF;
    const workerOptions = {
      interval: queueConfig.pollInterval
    };

    server.log(['reporting', 'worker', 'debug'], `${workerType} worker registered`);
    const worker = queue.registerWorker(workerType, function (payload) {
      const { objects, query, headers } = payload;
      server.log(['reporting', 'worker', 'debug'], `${workerType}: ${objects.length} saved object(s) to process`);

      return generateDocument.printablePdf(objects, query, headers)
      .then((pdfDoc) => {
        return pdfDoc.getBuffer()
        .then((contentBuffer) => {
          return {
            content_type: 'application/pdf',
            content: contentBuffer.toString('base64'),
          };
        });
      });
    }, workerOptions);

    worker.on('error', (err) => {
      server.log(['reporting', 'worker', 'debug'], `Worker error: (${err})`);
    });

    worker.on('job_timeout', (err) => {
      server.log(['reporting', 'worker', 'debug'], `Job timeout exceeded (${err.timeout})`);
    });
  };
};

