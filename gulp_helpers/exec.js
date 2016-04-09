var childProcess = require('child_process');
var Bluebird = require('bluebird');

module.exports = (gulpUtil, logger) => {
  return function exec(cmd, args, opts) {
    args = args || [];
    opts = opts || {};
    return new Bluebird(function (resolve, reject) {
      var proc = childProcess.spawn(cmd, args, opts);

      proc.stdout.on('data', function (data) {
        logger(data.toString('utf-8').trim());
      });

      proc.stderr.on('data', function (data) {
        gulpUtil.log(data.toString('utf-8').trim());
      });

      proc.on('error', function (err) {
        reject(err);
      });

      proc.on('close', function (code) {
        if (code !== 0) reject(new Error('Process exited with code ' + code));
        resolve();
      });
    });
  };
};

