const Promise = require('bluebird');
const _ = require('lodash');

const pdf = require('./pdf');
const getObjectQueue = require('./get_object_queue');
const getScreenshot = require('./get_screenshot');

module.exports = (server) => {
  const fetchObjectQueue = getObjectQueue(server);
  const fetchScreenshot = getScreenshot(server);

  return function generatePDFStream(type, objId, query, headers) {
    const pdfOutput = pdf.create();
    return fetchObjectQueue(type, objId)
    .then(function (objectQueue) {
      server.log(['reporting', 'debug'], `${objectQueue.length} item(s) to process`);

      return Promise.map(objectQueue, function (savedObj) {
        return fetchScreenshot(savedObj, query, headers)
        .then((filename) => _.assign({ filename }, savedObj));
      })
      .then(function (objects) {
        return objects.map(function (object) {
          return pdfOutput.addImage(object.filename, {
            title: object.title,
            description: object.description,
          });
        });
      });
    })
    .then(function () {
      const date = new Date().getTime();
      const filename = `report_${date}.pdf`;
      return pdfOutput.generate().getStream();
    });
  };
};
