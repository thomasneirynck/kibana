const path = require('path');
const _ = require('lodash');
const Horseman = require('node-horseman');
const phantomPath = require('./phantom').getPath();
const debug = require('./logger');

module.exports = function (phantomSettings, workingDir) {
  return {
    capture: capture,
  };

  function capture(url, opts) {
    opts = opts || {};
    var filepath = getFilepath(opts.filename);
    var operation;

    const ph = fetch(url, opts);

    if (opts.bounding) {
      operation = shotCropped(ph, opts.bounding, filepath);
    } else {
      operation = shot(ph, filepath);
    }

    return operation.catch(function (err) {
      debug('screenshot failed');
      console.error(err);
    })
    // .close()
    .then(function () {
      return filepath;
    });
  }

  function fetch(url, opts) {
    const { loadDelay, viewport } = phantomSettings;
    const phantomOpts = {
      phantomPath: phantomPath,
      injectJquery: false,
      timeout: 10000
    };

    debug('fetching screenshot of %s', url);

    const ph = new Horseman(phantomOpts)
    .viewport(viewport.width, viewport.height)
    .zoom(phantomSettings.zoom);

    return ph.then(function () {
      if (opts.headers) {
        debug('Setting headers', opts.headers);
        return ph.headers(opts.headers);
      }
    })
    .open(url)
    .then(function (status) {
      debug('url open status:', status, url);
      if (status !== 'success') throw new Error('URL open failed. Is the server running?');
    })
    .wait('.application visualize')
    .wait(loadDelay);
  };

  function getFilepath(filename) {
    if (!filename) {
      var ts = new Date().getTime();
      filename = 'screenshot-' + ts + '.png';
    }
    var outputDir = path.resolve(__dirname, '..', '..', workingDir);
    return path.join(outputDir, filename);
  }

  function shot(ph, filepath) {
    return ph.screenshot(filepath)
    .then(function () {
      debug('screenshot saved to %s', filepath);
    });
  }

  // cropped screenshot using DOM element or getBoundingClientRect
  // see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  function shotCropped(ph, bounding, filepath) {
    var viewport = phantomSettings.viewport;

    var contentOffset = _.defaults({}, bounding, {
      top: 90,
      left: 0,
      scrollbar: 0,
      footer: 0,
    });
    bounding = _.defaults(contentOffset, {
      width: viewport.width - contentOffset.left - contentOffset.scrollbar,
      height: viewport.height - contentOffset.top - contentOffset.footer,
    });
    debug(bounding);

    return ph.crop(bounding, filepath)
    .then(function () {
      debug('cropped screenshot saved to %s', filepath);
    });
  }
};
