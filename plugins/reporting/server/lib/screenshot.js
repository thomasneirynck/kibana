const _ = require('lodash');
const getPort = require('get-port');
const Promise = require('bluebird');
const Horseman = require('@elastic/node-horseman');
const temp = require('temp').track();

class Screenshot {
  constructor(phantomPath, captureSettings, screenshotSettings, logger) {
    this.phantomPath = phantomPath;
    this.captureSettings = captureSettings;
    this.screenshotSettings = screenshotSettings;
    this.logger = logger || _.noop;
  }

  capture(url, opts) {
    this.logger(`fetching screenshot of ${url}`);
    opts = _.assign({ basePath: this.screenshotSettings.basePath }, opts);
    return fetch(url, this.phantomPath, this.captureSettings, opts)
    .then(ph => {
      return getTargetFile()
      .then(filepath => {
        const operation = (opts.bounding)
          ? getShotCropped(ph, this.captureSettings.viewport, opts.bounding, filepath)
          : getShot(ph, filepath);

        return operation
        .then(() => {
          this.logger(`Screenshot saved to ${filepath}`);
          ph.close();
          return filepath;
        });
      })
      .catch((err) => {
        this.logger(`Screenshot failed ${err.message}`);
        ph.close();
        throw err;
      });
    });
  }
}

module.exports = function (phantomPath, captureSettings, screenshotSettings, logger) {
  return new Screenshot(phantomPath, captureSettings, screenshotSettings, logger);
};

function fetch(url, phantomPath, captureSettings, opts) {
  const { loadDelay, viewport, timeout } = captureSettings;
  const phantomOpts = {
    phantomPath: phantomPath,
    timeout: timeout,
    injectJquery: false,
  };
  const settings = {
    width: viewport.width,
    height: viewport.height,
    zoom: captureSettings.zoom
  };

  return createPhantom(phantomOpts, settings)
  .then((ph) => {
    if (opts.headers) return ph.headers(opts.headers).then(() => ph);
    return ph;
  })
  .then((ph) => {
    return ph.open(url).then(function (status) {
      if (status !== 'success') throw new Error('URL open failed. Is the server running?');
      return ph;
    });
  })
  .then(ph => {
    return ph
    .waitForSelector('.application visualize')
    .evaluate(function (basePath) {
      (function (window, document) {
        function injectCSS(path) {
          var node = document.createElement('link');
          node.rel = 'stylesheet';
          node.href = path;
          document.getElementsByTagName('head')[0].appendChild(node);
        };

        injectCSS(basePath + '/app/reporting/assets/reporting-overrides.css');
      }(window, window.document));
    }, opts.basePath)
    .wait(loadDelay)
    .then(() => ph);
  });
};

function createPhantom(phantomOpts, settings) {
  return Promise.resolve(getPort())
  .then(port => {
    const instanceOpts = Object.assign({ bridgePort: port }, phantomOpts);
    const ph = new Horseman(instanceOpts);
    return ph.viewport(settings.width, settings.height).zoom(settings.zoom)
    .then(() => ph);
  });
}

function getTargetFile() {
  return new Promise((resolve, reject) => {
    temp.open({ prefix: 'screenshot', suffix: '.png' }, (err, file) => {
      if (err) reject(err);
      else resolve(file);
    });
  })
  .then((file) => file.path);
}

function getShot(ph, filepath) {
  return ph.screenshot(filepath);
}

// cropped screenshot using DOM element or getBoundingClientRect
// see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
function getShotCropped(ph, viewport, bounding, filepath) {
  const contentOffset = _.defaults({}, bounding, {
    top: 90, // top chrome
    left: 0,
    right: 0,
    bottom: 0,
  });

  const boundingArea = _.defaults(contentOffset, {
    width: viewport.width - contentOffset.left - contentOffset.right,
    height: viewport.height - contentOffset.top - contentOffset.bottom,
  });

  return ph.crop(boundingArea, filepath);
}
