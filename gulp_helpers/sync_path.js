var path = require('path');
var Bluebird = require('bluebird');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');

var logger = require('./logger');

module.exports = (excludes) => {
  return function syncPathsTo(source, dest, options) {
    logger('Sync path:', source);
    options = options || {};

    return Bluebird.fromCallback(function (cb) {
      mkdirp(dest, cb);
    })
    .then(function () {
      // On Windows relative paths must be used rather than absolute, as the
      // colons in Windows absolute paths confuse rsync
      var relSource = path.relative(path.resolve(__dirname, '..'), source);
      var relDest = path.relative(path.resolve(__dirname, '..'), dest);
      var rsync = new Rsync();

      rsync.source(relSource).destination(relDest);
      rsync.flags('uav').recursive(true);
      if (options.delete) rsync.set('delete');
      rsync.exclude(excludes);

      // debugging
      rsync.output((data) => logger(data.toString('utf-8').trim()));

      return Bluebird.fromCallback(function (cb) {
        rsync.execute(cb);
      });
    });
  };
};
