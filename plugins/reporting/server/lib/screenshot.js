import path from 'path';
import getPort from 'get-port';
import Puid from 'puid';
import phantom from './phantom';

const puid = new Puid();

class Screenshot {
  constructor(phantomPath, captureSettings, screenshotSettings, logger) {
    this.phantomPath = phantomPath;
    this.captureSettings = captureSettings;
    this.screenshotSettings = screenshotSettings;
    this.logger = logger || function () {};
  }

  capture(url, opts) {
    this.logger(`fetching screenshot of ${url}`);
    opts = Object.assign({ basePath: this.screenshotSettings.basePath }, opts);

    return createPhantom(this.phantomPath, this.captureSettings)
    .then(ph => {
      const filepath = getTargetFile(this.screenshotSettings.imagePath);

      return loadUrl(ph, url, this.captureSettings, opts)
      .then(() => ph.screenshot(filepath, { bounding: opts.bounding }))
      .then(() => {
        this.logger(`Screenshot saved to ${filepath}`);
        return ph.destroy().then(() => filepath);
      })
      .catch(err => {
        this.logger(`Screenshot failed ${err.message}`);
        return ph.destroy().then(() => { throw err; });
      });
    });
  }
}

export default function screenshot(phantomPath, captureSettings, screenshotSettings, logger) {
  return new Screenshot(phantomPath, captureSettings, screenshotSettings, logger);
};

function createPhantom(phantomPath, captureSettings) {
  const { timeout } = captureSettings;

  return Promise.resolve(getPort())
  .then(port => {
    return phantom.create({
      ignoreSSLErrors: true,
      phantomPath: phantomPath,
      bridgePort: port,
      timeout,
    });
  });
}

function loadUrl(ph, url, captureSettings, opts) {
  const { timeout, viewport, zoom, loadDelay } = captureSettings;

  return ph.open(url, {
    headers: opts.headers,
    waitForSelector: '.application visualize',
    timeout,
    zoom,
    viewport,
  })
  .then(() => ph.evaluate(function (basePath) {
    (function (window, document) {
      function injectCSS(cssPath) {
        var node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = cssPath;
        document.getElementsByTagName('head')[0].appendChild(node);
      };

      injectCSS(basePath + '/plugins/reporting/styles/reporting-overrides.css');
    }(window, window.document));
  }, opts.basePath))
  .then(() => ph.wait(loadDelay));
};

function getTargetFile(imagePath) {
  return path.join(imagePath, `screenshot-${puid.generate()}.png`);
}