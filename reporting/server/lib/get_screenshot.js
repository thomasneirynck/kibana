// bounding boxes for various saved object types
const boundingBoxes = {
  visualization: {
    top: 116,
    left: 362,
    bottom: 8
  },
  search: {
    top: 116,
    left: 230,
    bottom: 0,
    right: 30,
  },
};

module.exports = (server) => {
  const config = server.config();
  // init the screenshot module
  const phantomSettings = config.get('reporting.phantom');
  const screenshotSettings = { basePath: config.get('server.basePath') };
  const screenshot = require('./screenshot')(phantomSettings, screenshotSettings);
  return function getScreenshot(savedObj, query, headers) {
    const objUrl = savedObj.getUrl(query);
    return screenshot.capture(objUrl, {
      headers,
      bounding: boundingBoxes[savedObj.type],
    });
  };
};
