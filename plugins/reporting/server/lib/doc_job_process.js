
const oncePerServer = require('./once_per_server');
const generateDocumentFactory = require('./generate_document');

module.exports = oncePerServer(server => {
  const { printablePdf } = generateDocumentFactory(server);

  return async function (job) {
    const { objects, query, headers } = job;
    const pdfDoc = await printablePdf(objects, query, headers);
    return {
      contentType: 'application/pdf',
      buffer: await pdfDoc.getBuffer(),
    };
  };
});
