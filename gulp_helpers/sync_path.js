const path = require('path');
const Bluebird = require('bluebird');
const mkdirp = require('mkdirp');
const Rsync = require('rsync');

const logger = require('./logger');

module.exports = (excludes) => {
  return function syncPathsTo(source, dest, options) {
    logger('Sync path:', source);
    options = options || {};

    return Bluebird.fromCallback(function (cb) {
      mkdirp(dest, cb);
    })
    .then(function () {
      source = path.resolve(__dirname, '..', source);
      const rsync = new Rsync();

      rsync.source(source).destination(dest);
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
