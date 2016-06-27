// Code borrowed heavily from phantomjs's install script
// https://github.com/Medium/phantomjs/blob/v1.9.19/install.js

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var extract = require('./extract');

const version = '1.9.8';
const basename = 'phantomjs-' + version;
const sourcePath = path.resolve(__dirname, '..', '..', '..', '..', '.phantom');

function installPhantom(installPath = sourcePath) {
  const phantomSource = getPackage(sourcePath);
  const phantomPackage = getPackage(installPath);

  return Promise.try(function () {
    fs.accessSync(phantomPackage.binary, fs.X_OK);
    return phantomPackage;
  })
  .catch(function () {
    // error here means the binary does not exist, so install it
    var fileType = phantomSource.ext.substring(1);
    var filepath = phantomSource.dir + '/' + phantomSource.base;

    return extract[fileType](filepath, phantomPackage.dir)
    .then(function () {
      return Promise.try(function () {
        fs.chmodSync(phantomPackage.binary, '755');
        return phantomPackage;
      });
    });
  });
}

function getPackage(installPath) {
  const platform = getTargetPlatform();
  const arch = getTargetArch();
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
    var msg = 'Unsupported platform: ' + platform + ' ' + arch;
    throw new Error(msg);
  }

  var filename = basename + '-' + suffix;
  var parsed = path.parse(path.join(installPath, filename));
  parsed.binary = path.join(installPath, binary);
  return parsed;
}

/**
 * @return {string}
 */
function getTargetPlatform() {
  return process.env.PHANTOMJS_PLATFORM || process.platform;
}

/**
 * @return {string}
 */
function getTargetArch() {
  return process.env.PHANTOMJS_ARCH || process.arch;
}

module.exports = {
  install: installPhantom
};
