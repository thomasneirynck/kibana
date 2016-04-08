var fs = require('fs');
var execFile = require('child_process').execFile;
var Promise = require('bluebird');
var unzip = require('unzip');

exports.zip = function (filepath, target) {
  return new Promise(function (resolve, reject) {
    var i = 0;
    var extract = unzip.Extract;

    fs.createReadStream(filepath)
    .pipe(extract({ path: target }))
    .on('error', function (err) {
      reject(new Error('Failed to unzip file'));
    })
    .on('close', resolve);
  });
};

exports.bz2 = function (filepath, target) {
  // For our use case, tar.bz2 always means we're in linux,
  // so we can defer to tar via child process
  var options = {
    cwd: target
  };

  return new Promise(function (resolve, reject) {
    execFile('tar', ['jxf', filepath], options, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
