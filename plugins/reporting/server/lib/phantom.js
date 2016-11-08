import path from 'path';
import fs from 'fs';
import { fromCallback } from 'bluebird';
import driver from '@elastic/node-phantom-simple';
import extract from './extract';

const version = '2.1.1';
const basename = 'phantomjs-' + version;
const sourcePath = path.resolve(__dirname, '..', '..', '..', '..', '.phantom');

export default {
  install(installPath = sourcePath) {
    return new Promise((resolve, reject) => {
      const phantomPackage = _getPackage(installPath);

      try {
        fs.accessSync(phantomPackage.binary, fs.X_OK);
        resolve(phantomPackage);
      } catch (accessErr) {
        // error here means the binary does not exist, so install it
        const phantomSource = _getPackage(sourcePath);
        const fileType = phantomSource.ext.substring(1);
        const filepath = phantomSource.dir + '/' + phantomSource.base;

        return extract[fileType](filepath, phantomPackage.dir)
        .then(function () {
          try {
            fs.chmodSync(phantomPackage.binary, '755');
            resolve(phantomPackage);
          } catch (chmodErr) {
            reject(chmodErr);
          }
        });
      }
    });
  },

  create(options) {
    return new Phantom(options);
  }
};

function Phantom(options) {
  const phantomOptions = _getPhantomOptions(options);

  const ready = fromCallback(cb => driver.create(phantomOptions, cb))
  .then(browser => {
    if (!browser) throw new Error('Phantom driver failed to initialize');
    this.browser = browser;
    return fromCallback(cb => this.browser.createPage(cb));
  })
  .then(page => {
    if (!page) throw new Error('Phantom driver failed to create the page instance');
    this.page = page;
  });

  return _createPhantomInstance(ready, this, options);
}

function _createPhantomInstance(ready, phantom, options) {
  const validateInstance = () => {
    if (phantom.page === false || phantom.browser === false) throw new Error('Phantom instance is closed');
  };

  const configurePage = (pageOptions) => {
    const RESOURCE_TIMEOUT = 5000;

    return ready.then(() => {
      return fromCallback(cb => phantom.page.set('resourceTimeout', RESOURCE_TIMEOUT, cb))
      .then(() => {
        if (pageOptions.viewport) return fromCallback(cb => phantom.page.set('viewportSize', pageOptions.viewport, cb));
      })
      .then(() => {
        if (pageOptions.zoom) return fromCallback(cb => phantom.page.set('zoomFactor', pageOptions.zoom, cb));
      })
      .then(() => {
        if (pageOptions.headers) return fromCallback(cb => phantom.page.set('customHeaders', pageOptions.headers, cb));
      });
    });
  };

  return {
    open(url, pageOptions) {
      return ready.then(() => {
        validateInstance();
        return configurePage(pageOptions)
        .then(() => fromCallback(cb => phantom.page.open(url, cb)))
        .then(status => {
          if (status !== 'success') throw new Error('URL open failed. Is the server running?');
          if (pageOptions.waitForSelector) {
            const WAIT_TIMEOUT = pageOptions.timeout || options.timeout || 10000;
            return fromCallback(cb => phantom.page.waitForSelector(pageOptions.waitForSelector, WAIT_TIMEOUT, cb));
          }
        });
      });
    },

    evaluate(fn, ...args) {
      return ready.then(() => {
        validateInstance();
        return fromCallback(cb => phantom.page.evaluate(fn, ...args, cb));
      });
    },

    wait(timeout) {
      return ready.then(() => {
        validateInstance();
        return new Promise(resolve => setTimeout(resolve, timeout));
      });
    },

    screenshot(screenshotPath, screenshotOptions) {
      validateInstance();


      return ready.then(() => {
        function saveScreenshot() {
          return fromCallback(cb => phantom.page.render(screenshotPath, cb));
        }

        if (!screenshotOptions.bounding) {
          return saveScreenshot();
        }

        return fromCallback(cb => phantom.page.get('viewportSize', cb))
        .then(viewportSize => {
          const contentOffset = Object.assign({
            top: 90, // top chrome
            left: 0,
            right: 0,
            bottom: 0,
          }, screenshotOptions.bounding);

          const boundingArea = {
            top: contentOffset.top,
            left: contentOffset.left,
            width: viewportSize.width - contentOffset.left - contentOffset.right,
            height: viewportSize.height - contentOffset.top - contentOffset.bottom,
          };

          return fromCallback(cb => phantom.page.get('clipRect', cb))
          .then(prevClipRect => {
            return fromCallback(cb => phantom.page.set('clipRect', boundingArea, cb))
            .then(saveScreenshot)
            .then(() => fromCallback(cb => phantom.page.set('clipRect', prevClipRect, cb)));
          });
        });
      });
    },

    destroy() {
      validateInstance();

      return ready.then(() => {
        return fromCallback(cb => phantom.browser.exit(cb))
        .then(() => {
          phantom.browser = false;
          phantom.page = false;
        });
      });
    }
  };
}

function _getPhantomOptions(options = {}) {
  return {
    parameters: {
      'load-images': true,
      'ssl-protocol': 'any',
      'ignore-ssl-errors': (options.ignoreSSLErrors != null) ? options.ignoreSSLErrors : true,
    },
    path: options.phantomPath || 'phantomjs',
    bridge: { port: options.bridgePort || 0 },
  };
}

function _getPackage(installPath) {
  // Code borrowed heavily from phantomjs's install script
  // https://github.com/Medium/phantomjs/blob/v1.9.19/install.js

  const platform = process.env.PHANTOMJS_PLATFORM || process.platform;
  const arch = process.env.PHANTOMJS_ARCH || process.arch;
  let suffix;
  let binary;

  if (platform === 'linux' && arch === 'x64') {
    binary = path.join(basename + '-linux-x86_64', 'bin', 'phantomjs');
    suffix = 'linux-x86_64.tar.bz2';
  } else if (platform === 'linux' && arch === 'ia32') {
    binary = path.join(basename + '-linux-i686', 'bin', 'phantomjs');
    suffix = 'linux-i686.tar.bz2';
  } else if (platform === 'darwin' || platform === 'openbsd' || platform === 'freebsd') {
    binary = path.join(basename + '-macosx', 'bin', 'phantomjs');
    suffix = 'macosx.zip';
  } else if (platform === 'win32') {
    binary = path.join(basename + '-windows', 'phantomjs.exe');
    suffix = 'windows.zip';
  } else {
    const msg = 'Unsupported platform: ' + platform + ' ' + arch;
    throw new Error(msg);
  }

  const filename = basename + '-' + suffix;
  const parsed = path.parse(path.join(installPath, filename));
  parsed.binary = path.join(installPath, binary);
  return parsed;
}
