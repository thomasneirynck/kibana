const childProcess = require('child_process');
const Bluebird = require('bluebird');

module.exports = (gulpUtil) => {
  return function exec(cmd, args, opts) {
    args = args || [];
    opts = opts || {};
    return new Bluebird(function (resolve, reject) {
      const proc = childProcess.spawn(cmd, args, opts);

      proc.stdout.on('data', function (data) {
        gulpUtil.log(data.toString('utf-8').trim());
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

