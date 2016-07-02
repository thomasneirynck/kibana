const Promise = require('bluebird');
const _ = require('lodash');

const pdf = require('./pdf');
const oncePerServer = require('./once_per_server');
const getScreenshotFactory = require('./get_screenshot');

function generateDocumentFactory(server) {
  const getScreenshot = getScreenshotFactory(server);

  return {
    printablePdf: printablePdf,
  };

  function printablePdf(savedObjects, query, headers) {
    const pdfOutput = pdf.create();

    return Promise.map(savedObjects, function (savedObj) {
      return getScreenshot(savedObj.url, savedObj.type, headers)
      .then((filename) => {
        server.log(['reporting', 'debug'], `${savedObj.id} -> ${filename}`);
        return _.assign({ filename }, savedObj);
      })
      .then((object) => {
        return pdfOutput.addImage(object.filename, {
          title: object.title,
          description: object.description,
        });
      });
    })
    .then(function () {
      return pdfOutput.generate();
    });
  };
}

module.exports = oncePerServer(generateDocumentFactory);
