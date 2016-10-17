var fs = require('fs');
var path = require('path');
var Bluebird = require('bluebird');
var mkdirp = require('mkdirp');
var del = require('del');
var request = require('request');
var hasha = require('hasha');
var _ = require('lodash');

var logger = require('./logger');

function fetchBinaries(dest) {
  var phantomDest = path.resolve(dest);
  var host = 'https://github.com/Medium/phantomjs/releases/download/v2.1.1/';

  var phantomBinaries = [{
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
    description: 'Linux x86_64',
    url: host + 'phantomjs-2.1.1-linux-x86_64.tar.bz2',
    filename: 'phantomjs-2.1.1-linux-x86_64.tar.bz2',
    checksum: '1c947d57fce2f21ce0b43fe2ed7cd361',
  }, {
    description: 'Linux x86',
    url: host + 'phantomjs-2.1.1-linux-i686.tar.bz2',
    filename: 'phantomjs-2.1.1-linux-i686.tar.bz2',
    checksum: '0396e8249e082f72c1e39d33fc9d8de6',
  }];

  // verify the download checksum
  function verifyChecksum(file, binary) {
    return hasha.fromFile(file, { algorithm: 'md5' })
    .then(function (checksum) {
      if (binary.checksum !== checksum) {
        logger('Download checksum', checksum);
        logger('Expected checksum', binary.checksum);
        throw new Error(binary.description + ' checksum failed');
      }
    });
  }

  return Bluebird.fromCallback(function (cb) {
    logger('Phantom target:', phantomDest);
    mkdirp(phantomDest, cb);
  })
  .then(function () {
    // clean up non-matching phantom binaries
    var allowedFiles = phantomBinaries.map(function (binary) {
      return binary.filename;
    });

    return Bluebird.fromCallback(function (cb) {
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
    var requiredDownloads = Bluebird.map(phantomBinaries, function (binary) {
      var filepath = path.join(phantomDest, binary.filename);
      logger('Verifying binary', filepath);
      return verifyChecksum(filepath, binary).then(() => false, () => binary);
    }).then(function (downloads) {
      return downloads.filter(Boolean);
    });

    return Bluebird.mapSeries(requiredDownloads, function (binary) {
      var filepath = path.join(phantomDest, binary.filename);

      // add delays after the first download
      logger('Downloading', binary.url);
      return new Bluebird(function (resolve, reject) {
        var ws = fs.createWriteStream(filepath)
        .on('finish', function () {
          logger('Verifying binary', filepath);
          verifyChecksum(filepath, binary)
          .then(resolve, reject);
        });

        // download binary, stream to destination
        request(binary.url)
        .on('error', reject)
        .pipe(ws);
      });
    });
  });
}

module.exports = fetchBinaries;
