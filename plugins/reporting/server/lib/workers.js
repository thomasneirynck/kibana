const { JOBTYPES } = require('./constants');
const oncePerServer = require('./once_per_server');
const docJobProcessFactory = require('./doc_job_process');

function workersFactory(server) {
  const docJobProcess = docJobProcessFactory(server);

  const workers = {};

  // printable PDFs
  workers[JOBTYPES.PRINTABLE_PDF] = async function (payload) {
    const workerType = JOBTYPES.PRINTABLE_PDF;

    server.log(['reporting', 'worker', 'debug'], `Converting ${payload.objects.length} saved object(s) to ${workerType}`);
    const { contentType, buffer } = await docJobProcess(payload);

    return {
      content_type: contentType,
      content: buffer.toString('base64')
    };
  };
  workers[JOBTYPES.PRINTABLE_PDF].encoding = 'base64';
  workers[JOBTYPES.PRINTABLE_PDF].contentType = docJobProcess.contentType;

  return workers;
};

module.exports = oncePerServer(workersFactory);