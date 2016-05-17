const Promise = require('bluebird');
const _ = require('lodash');

const pdf = require('./pdf');
const getScreenshot = require('./get_screenshot');

module.exports = (server) => {
  const fetchScreenshot = getScreenshot(server);

  return {
    printablePdf: printablePdf,
  };

  function printablePdf(savedObjects, query, headers) {
    const pdfOutput = pdf.create();

    return Promise.map(savedObjects, function (savedObj) {
      return fetchScreenshot(savedObj.url, savedObj.type, headers)
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
};
