const fs = require('fs');
const path = require('path');
const { fromCallback } = require('bluebird');
const mkdirp = require('mkdirp');
const del = require('del');
const request = require('request');
const hasha = require('hasha');
const _ = require('lodash');

const logger = require('./logger');

const CACHE_PATH = path.resolve(__dirname, '..', '.phantom');

function fetchBinaries(dest) {
  const phantomDest = path.resolve(dest);
  const host = 'https://github.com/Medium/phantomjs/releases/download/v2.1.1/';

  const phantomBinaries = [{
    description: 'Windows',
    url: host + 'phantomjs-2.1.1-windows.zip',
    filename: 'phantomjs-2.1.1-windows.zip',
    checksum: '4104470d43ddf2a195e8869deef0aa69',
  }, {
    description: 'Max OS X',
    url: host + 'phantomjs-2.1.1-macosx.zip',
    filename: 'phantomjs-2.1.1-macosx.zip',
    checksum: 'b0c038bd139b9ecaad8fd321070c1651',
  }, {
    description: 'Linux',
    url: host + 'phantomjs-2.1.1-linux-x86_64.tar.bz2',
    filename: 'phantomjs-2.1.1-linux-x86_64.tar.bz2',
    checksum: '1c947d57fce2f21ce0b43fe2ed7cd361',
  }];

  // verify the download checksum
  function verifyChecksum(file, binaryChecksum) {
    return hasha.fromFile(file, { algorithm: 'md5' })
    .then(function (checksum) {
      if (binaryChecksum !== checksum) {
        logger('Download checksum', checksum);
        logger('Expected checksum', binaryChecksum);
        throw new Error('checksum failed');
      }
    });
  }

  return fromCallback(function (cb) {
    logger('Phantom target:', phantomDest);
    mkdirp(phantomDest, cb);
  })
  .then(function () {
    // clean up non-matching phantom binaries
    const allowedFiles = phantomBinaries.map(binary => binary.filename);

    return fromCallback(function (cb) {
      fs.readdir(phantomDest, cb);
    })
    .then(function (files) {
      return files.map(function (file) {
        if (file === '.empty') return false;
        if (_.contains(allowedFiles, file)) return false;
        return path.join(phantomDest, file);
      }).filter(Boolean);
    })
    .then(function (extraFiles) {
      return del(extraFiles);
    });
  })
  .then(function () {
    // use checksum verification to create list of required downloads
    const requiredBinaries = phantomBinaries.map(binary => {
      const filepath = path.join(phantomDest, binary.filename);

      logger('Verifying binary', filepath);
      return verifyChecksum(filepath, binary.checksum)
      .then(() => false)
      .catch(() => {
        // file isn't in the destination, check the cache path
        const cachedFilepath = path.join(CACHE_PATH, binary.filename);
        return verifyChecksum(cachedFilepath, binary.checksum)
        .then(() => {
          // cached file matches, copy to destination
          logger('Copying from cache', cachedFilepath);

          return new Promise((resolve, reject) => {
            // on failure, fall back to the download
            function handleFailed() {
              logger('Copying FAILED', cachedFilepath);
              reject();
            }

            const ws = fs.createWriteStream(filepath);
            fs.createReadStream(cachedFilepath).pipe(ws).on('error', handleFailed);
            ws.on('error', handleFailed).on('close', resolve);
          });
        })
        .catch(() => binary);
      });
    });

    return Promise.all(requiredBinaries)
    .then(downloads => downloads.filter(Boolean))
    .then(requiredDownloads => {
      // perform any required downloads
      function downloadBinary(binary) {
        const { url, filename, checksum, description } = binary;
        const filepath = path.join(phantomDest, filename);

        logger('Downloading', url);

        return new Promise(function (resolve, reject) {
          const ws = fs.createWriteStream(filepath);

          // when stream completes, checksum the result
          ws.on('finish', function () {
            logger('Verifying binary', filepath);

            verifyChecksum(filepath, checksum)
            .then(resolve, () => {
              reject(new Error(`checksum failed: ${description}`));
            });
          });

          // download binary, stream to destination
          request(url).on('error', reject).pipe(ws);
        });
      }

      return requiredDownloads.reduce((chain, binary) => {
        return chain.then(() => downloadBinary(binary));
      }, Promise.resolve());
    });
  });
}

module.exports = fetchBinaries;
