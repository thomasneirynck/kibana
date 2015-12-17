var path = require('path');
var _ = require('lodash');
var Horseman = require('node-horseman');
var phantomPath = require('./phantom').getPath();
var debug = require('./logger');

module.exports = function (config) {
  var kibanaConfig = config;
  var phantomSettings = kibanaConfig.get('reporting.phantom');
  var workingDir = kibanaConfig.get('reporting.workingDir');

  return {
    capture: capture,
    _fetch: fetch,
  };

  function capture(url, bounding, filename) {
    var filepath;
    var op;

    if (typeof bounding !== 'object') {
      filepath = getFilepath(bounding);
      op = shot(url, filepath);
    } else {
      filepath = getFilepath(filename);
      op = shotCropped(url, bounding, filepath);
    }

    return op.catch(function (err) {
      debug('screenshot failed');
      console.error(err);
    })
    .close()
    .then(function () {
      return filepath;
    });
  }

  function fetch(url) {
    var loadDelay = phantomSettings.loadDelay;
    var viewport = phantomSettings.viewport;

    var phantomOpts = {
      phantomPath: phantomPath,
      injectJquery: false,
      timeout: 10000
    };

    debug('fetching screenshot of %s', url);
    var ph = new Horseman(phantomOpts)
    .viewport(viewport.width, viewport.height)
    .zoom(phantomSettings.zoom);

    var auth = kibanaConfig.get('reporting.auth');
    if (auth.username || auth.password) {
      debug('Authenticating as user: ', auth.username);
      ph = ph.authentication(auth.username, auth.password);
    }

    ph = ph.open(url)
    .then(function (status) {
      debug('url open status: ' + status);
      if (status !== 'success') throw new Error('URL open failed. Is the server running?');
    })
    .wait('.application visualize')
    .wait(loadDelay);

    return ph;
  };

  function getFilepath(filename) {
    if (!filename) {
      var ts = new Date().getTime();
      filename = 'screenshot-' + ts + '.png';
    }
    var outputDir = path.resolve(__dirname, '..', '..', workingDir);
    return path.join(outputDir, filename);
  }

  function shot(url, filepath) {
    return fetch(url)
    .screenshot(filepath)
    .then(function () {
      debug('screenshot saved to %s', filepath);
    });
  }

  // cropped screenshot using DOM element or getBoundingClientRect
  // see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  function shotCropped(url, bounding, filepath) {
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

    return fetch(url)
    .crop(bounding, filepath)
    .then(function () {
      debug('cropped screenshot saved to %s', filepath);
    });
  }
};
