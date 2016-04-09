var path = require('path');
var Bluebird = require('bluebird');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');

var logger = require('./logger');

module.exports = (excludes) => {
  return function syncPathsTo(includes, dest) {
    logger(includes);
    // return;

    return Bluebird.fromCallback(function (cb) {
      mkdirp(dest, cb);
    })
    .then(function () {
      return Bluebird.mapSeries(includes, function (source) {
        var source = path.resolve(__dirname, '..', source);
        var rsync = new Rsync();

        rsync.source(source).destination(dest);
        rsync.flags('uav').recursive(true).set('delete');
        rsync.include(includes);
        rsync.exclude(excludes);

        // debugging
        rsync.output((data) => logger(data.toString('utf-8').trim()));

        return Bluebird.fromCallback(function (cb) {
          rsync.execute(cb);
        });
      });
    });
  };
};