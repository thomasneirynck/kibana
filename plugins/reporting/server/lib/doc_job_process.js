
const oncePerServer = require('./once_per_server');
const generateDocumentFactory = require('./generate_document');
import cryptoFactory from './crypto';
import { omit } from 'lodash';

const KBN_SCREENSHOT_HEADER_BLACKLIST = [ 'accept-encoding' ];

function docJobProcessFactory(server) {
  const { printablePdf } = generateDocumentFactory(server);
  const crypto = cryptoFactory(server);

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
