const queue = require('queue');
const screenshotFactory = require('./screenshot');
const oncePerServer = require('./once_per_server');

// bounding boxes for various saved object types
const boundingBoxes = {
  visualization: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  search: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 16, // scrollbar in discover refuses to hide with ::-webkit-scrollbar css rule
  },
};

function getScreenshotFactory(server) {
  const config = server.config();
  const logger = (msg) => server.log(['reporting', 'debug'], msg);

  const phantomPath = server.plugins.reporting.phantom.binary;
  const captureSettings = config.get('xpack.reporting.capture');
  const screenshotSettings = { basePath: config.get('server.basePath'), imagePath: config.get('path.data') };
  const captureConcurrency = captureSettings.concurrency;
  logger(`Screenshot concurrency: ${captureConcurrency}`);

  // init the screenshot module
  const screenshot = screenshotFactory(phantomPath, captureSettings, screenshotSettings, logger);

  // create the process queue
  const screenshotQueue = queue({ concurrency: captureConcurrency });

  return function getScreenshot(objUrl, type, headers) {
    return new Promise(function (resolve, reject) {
      screenshotQueue.push(function (cb) {
        return screenshot.capture(objUrl, {
          headers,
          bounding: boundingBoxes[type],
        })
        .then((filename) => {
          resolve(filename);
          cb();
        }, (err) => {
          screenshotQueue.end(err);
          reject(err);
          cb();
        });
      });

      if (!screenshotQueue.running) screenshotQueue.start();
    });
  };
};

module.exports = oncePerServer(getScreenshotFactory);
