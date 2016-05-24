var fs = require('fs');
var unzip = require('unzip');
var bz2 = require('unbzip2-stream');
var tar = require('tar-fs');

exports.zip = function (filepath, target) {
  return new Promise(function (resolve, reject) {
    var extract = unzip.Extract;

    fs.createReadStream(filepath)
    .pipe(extract({ path: target }))
    .on('error', function () {
      reject(new Error('Failed to unzip file'));
    })
    .on('close', resolve);
  });
};

exports.bz2 = function (filepath, target) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(filepath)
    .pipe(bz2())
    .pipe(tar.extract(target))
    .on('error', function () {
      reject(new Error('Failed to unpack tar.bz2 file'));
    })
    .on('finish', resolve);
  });
};
