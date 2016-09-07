
const oncePerServer = require('./once_per_server');
const generateDocumentFactory = require('./generate_document');
const { omit } = require('lodash');

const KBN_SCREENSHOT_HEADER_BLACKLIST = [
  'accept-encoding',
  'content-length',
  'content-type'
];

function docJobProcessFactory(server) {
  const { printablePdf } = generateDocumentFactory(server);

  return async function (job) {
    const { objects, query } = job;
    const headers = omit(job.headers, KBN_SCREENSHOT_HEADER_BLACKLIST);
    const pdfDoc = await printablePdf(objects, query, headers);
    return {
      contentType: 'application/pdf',
      buffer: await pdfDoc.getBuffer(),
    };
  };
}

module.exports = oncePerServer(docJobProcessFactory);
