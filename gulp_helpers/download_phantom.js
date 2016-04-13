var fs = require('fs');
var path = require('path');
var url = require('url');
var Bluebird = require('bluebird');
var mkdirp = require('mkdirp');
var request = require('request');
var md5 = require('md5');

var logger = require('./logger');

function fetchBinaries(dest) {
  var phantomDest = path.resolve(dest);

  var phantomBinaries = [{
    description: 'Windows',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-windows.zip',
    checksum: 'c5eed3aeb356ee597a457ab5b1bea870',
  }, {
    description: 'Max OS X',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-macosx.zip',
    checksum: 'fb850d56c033dd6e1142953904f62614',
  }, {
    description: 'Linux x86_64',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2',
    checksum: '4ea7aa79e45fbc487a63ef4788a18ef7',
  }, {
    description: 'Linux x86',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-i686.tar.bz2',
    checksum: '814a438ca515c6f7b1b2259d0d5bc804',
  }];

  var makeTarget = Bluebird.fromCallback(function (cb) {
    mkdirp(phantomDest, cb);
  });

  return phantomBinaries.reduce(function (chain, binary) {
    var params = url.parse(binary.url);
    var filename = params.pathname.split('/').pop();
    var filepath = path.join(phantomDest, filename);

    // verify the download checksum
    var verifyChecksum = function (file, cb) {
      fs.readFile(file, function (err, buf) {
        if (err) return cb(err);
        var checksum = md5(buf);
        if (binary.checksum !== checksum) {
          logger('Download checksum', checksum);
          logger('Expected checksum', binary.checksum);
          return cb(binary.description + ' checksum failed');
        }
        cb();
      });
    };

    // add delays after the first download
    return chain.then(function () {
      logger('Verifying binary', filepath);
      return Bluebird.fromCallback(function (cb) {
        verifyChecksum(filepath, cb);
      })
      .catch(function () {
        logger('Binary check failed, attempting to download');

        return Bluebird.delay(3000)
        .then(function () {
          logger('Downloading', binary.url);
          return Bluebird.fromCallback(function (cb) {
            var ws = fs.createWriteStream(filepath)
            .on('finish', function () {
              verifyChecksum(filepath, cb);
            });

            // download binary, stream to destination
            request(binary.url)
            .on('error', cb)
            .pipe(ws);
          });
        });
      });
    });
  }, makeTarget);
}

module.exports = fetchBinaries;