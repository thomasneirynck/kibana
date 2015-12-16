// Code borrowed heavily from phantomjs's install script
// https://github.com/Medium/phantomjs/blob/v1.9.19/install.js

var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var extract = require('./extract');
var debug = require('./logger');

// var installed = false;

module.exports = {
  install: installPhantom,
  getPath: getBinaryPath
};

function installPhantom() {
  var phantomPackage = getPackage();

  return Promise.try(function () {
    var installed = fs.accessSync(phantomPackage.binary);

    debug('Phantom is already installed', phantomPackage.binary);
    return phantomPackage.binary;
  })
  .catch(function (err) {
    // error here means the binary does not exist, so install it
    debug('Phantom is being installed...', phantomPackage.binary);
    var fileType = phantomPackage.ext.substring(1);
    var filepath = phantomPackage.dir + '/' + phantomPackage.base;

    return extract[fileType](filepath, phantomPackage.dir)
    .then(function () {
      return Promise.try(function () {
        fs.chmodSync(phantomPackage.binary, '755');
        return phantomPackage.binary;
      });
    });
  });
}

function getBinaryPath() {
  // if (!installed) throw new Error('phantom is not installed');

  var phantomPackage = getPackage();
  return phantomPackage.binary;
}

function getPackagePath() {
  var dirName = '.phantom';
  return path.resolve(__dirname, '..', '..', dirName) + '/';
}

function getPackage() {
  var version = '1.9.8';
  var basename = 'phantomjs-' + version;
  var suffix;
  var checksum;
  var binary;
  var binaryPath;
  var filepath = getPackagePath();

  var platform = getTargetPlatform();
  var arch = getTargetArch();

  if (platform === 'linux' && arch === 'x64') {
    binary = path.join(basename + '-linux-x86_64', 'bin', 'phantomjs');
    suffix = 'linux-x86_64.tar.bz2';
    checksum = '4ea7aa79e45fbc487a63ef4788a18ef7';
  } else if (platform === 'linux' && arch === 'ia32') {
    binary = path.join(basename + '-linux-i686', 'bin', 'phantomjs');
    suffix = 'linux-i686.tar.bz2';
    checksum = '814a438ca515c6f7b1b2259d0d5bc804';
  } else if (platform === 'darwin' || platform === 'openbsd' || platform === 'freebsd') {
    binary = path.join(basename + '-macosx', 'bin', 'phantomjs');
    suffix = 'macosx.zip';
    checksum = 'fb850d56c033dd6e1142953904f62614';
  } else if (platform === 'win32') {
    binary = path.join(basename + '-windows', 'phantomjs.exe');
    suffix = 'windows.zip';
    checksum = 'c5eed3aeb356ee597a457ab5b1bea870';
  } else {
    var msg = 'Unsupported platform: ' + platform + ' ' + arch;
    throw new Error(msg);
  }

  var filename = basename + '-' + suffix;
  var parsed = path.parse(filepath + filename);
  parsed.binary = filepath + binary;
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
