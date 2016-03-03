const screenshot = require('./screenshot');

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
  const logger = (msg) => server.log(['reporting', 'debug'], msg);

  const phantomSettings = config.get('reporting.phantom');
  const screenshotSettings = { basePath: config.get('server.basePath') };
  const ss = screenshot(phantomSettings, screenshotSettings, logger);

  return function getScreenshot(objUrl, type, headers) {
    return ss.capture(objUrl, {
      headers,
      bounding: boundingBoxes[type],
    });
  };
};
