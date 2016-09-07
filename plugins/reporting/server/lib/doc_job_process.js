
const oncePerServer = require('./once_per_server');
const generateDocumentFactory = require('./generate_document');
const makeCryptoWith = require('@elastic/node-crypto');
const { omit } = require('lodash');

const KBN_SCREENSHOT_HEADER_BLACKLIST = [
  'accept-encoding',
  'content-length',
  'content-type'
];

function docJobProcessFactory(server) {
  const encryptionKey = server.config().get('xpack.reporting.encryptionKey');

  const { printablePdf } = generateDocumentFactory(server);
  const crypto = makeCryptoWith({ encryptionKey });

  return async function (job) {
    const { objects, query, headers:serializedEncryptedHeaders } = job;
    const headers = omit(await crypto.decrypt(serializedEncryptedHeaders), KBN_SCREENSHOT_HEADER_BLACKLIST);
    const pdfDoc = await printablePdf(objects, query, headers);
    return {
      contentType: 'application/pdf',
      buffer: await pdfDoc.getBuffer(),
    };
  };
}

module.exports = oncePerServer(docJobProcessFactory);
