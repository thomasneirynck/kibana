const Promise = require('bluebird');
const _ = require('lodash');

const pdf = require('./pdf');
const getObjectQueue = require('./get_object_queue');
const getScreenshot = require('./get_screenshot');

module.exports = (server) => {
  const fetchObjectQueue = getObjectQueue(server);
  const fetchScreenshot = getScreenshot(server);

  function mapScreenshots(objectQueue, query, headers) {
    return Promise.map(objectQueue, function (savedObj) {
      const objUrl = savedObj.getUrl(query);

      return fetchScreenshot(objUrl, savedObj.type, headers)
      .then((filename) => {
        server.log(['reporting', 'debug'], `${savedObj.id} -> ${filename}`);
        return _.assign({ filename }, savedObj);
      });
    });
  }

  return function generatePDFStream(type, objId, query, headers) {
    const pdfOutput = pdf.create();

    return fetchObjectQueue(type, objId)
    .then(function (objectQueue) {
      server.log(['reporting', 'debug'], `${objectQueue.length} saved object(s) to process`);

      return mapScreenshots(objectQueue, query, headers)
      .then(function (objects) {
        return Promise.map(objects, function (object) {
          return pdfOutput.addImage(object.filename, {
            title: object.title,
            description: object.description,
          });
        });
      });
    })
    .then(function () {
      // const date = new Date().getTime();
      // const filename = `report_${date}.pdf`;
      return pdfOutput.generate().getStream();
    });
  };
};
