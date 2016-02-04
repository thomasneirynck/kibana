const Promise = require('bluebird');
const pdf = require('../lib/pdf');
const _ = require('lodash');
const debug = require('../lib/logger');
module.exports = (server) => {
  const getScreenshot = require('./get_screenshot')(server);
  const getObjectQueue = require('./get_object_queue')(server);
  return function generatePDFStream(type, objId, query, headers) {
    const pdfOutput = pdf.create();
    return getObjectQueue(type, objId)
    .then(function (objectQueue) {
      debug(`${objectQueue.length} item(s) to process`);

      return Promise.map(objectQueue, function (savedObj) {
        return getScreenshot(savedObj, query, headers)
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
