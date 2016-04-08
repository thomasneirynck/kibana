const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const Horseman = require('node-horseman');
const phantomPath = require('./phantom').getPath();
const temp = require('temp').track();

class Screenshot {
  constructor(phantomSettings, screenshotSettings, logger) {
    this.phantomSettings = phantomSettings;
    this.screenshotSettings = screenshotSettings;
    this.logger = logger || _.noop;
  }

  capture(url, opts) {
    this.logger(`fetching screenshot of ${url}`);
    opts = _.assign({ basePath: this.screenshotSettings.basePath }, opts);
    const ph = fetch(url, this.phantomSettings, opts);

    return ph
    .then(() => getTargetFile())
    .then(filepath => {
      const operation = (opts.bounding)
        ? getShotCropped(ph, this.phantomSettings.viewport, opts.bounding, filepath)
        : getShot(ph, filepath);

      return operation
      .then(() => {
        this.logger(`Screenshot saved to ${filepath}`);
        return filepath;
      });
    })
    .catch((err) => {
      this.logger(`Screenshot failed ${err.message}`);
      throw err;
    })
    .close();
  }
}

module.exports = function (phantomSettings, screenshotSettings, logger) {
  return new Screenshot(phantomSettings, screenshotSettings, logger);
};

function fetch(url, phantomSettings, opts) {
  const { loadDelay, viewport, timeout } = phantomSettings;
  const phantomOpts = {
    phantomPath: phantomPath,
    timeout: timeout,
    injectJquery: false,
  };
  const settings = {
    width: viewport.width,
    height: viewport.height,
    zoom: phantomSettings.zoom
  };

  const ph = createPhantom(phantomOpts, settings);

  return ph.then(function () {
    if (opts.headers) {
      return ph.headers(opts.headers);
    }
  })
  .open(url)
  .then(function (status) {
    if (status !== 'success') throw new Error('URL open failed. Is the server running?');
  })
  // .on('consoleMessage', function (msg) {
  //   console.log('PHANTOM:', msg);
  // })
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
  .wait(loadDelay);
};

function createPhantom(phantomOpts, settings) {
  return new Horseman(phantomOpts)
  .viewport(settings.width, settings.height)
  .zoom(settings.zoom);
}

function getTargetFile() {
  return Promise.fromCallback(function (cb) {
    temp.open({ prefix: 'screenshot', suffix: '.png' }, cb);
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
