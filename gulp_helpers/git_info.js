var path = require('path');
var Bluebird = require('bluebird');
var simpleGit = require('simple-git');
var gitDir = path.resolve(__dirname, '..');

function gitInfo() {
  var git = simpleGit(gitDir);
  return Bluebird.fromCallback(function (cb) {
    git.log(cb);
  })
  .then(function (log) {
    return {
      number: log.total,
      sha: log.latest.hash,
    };
  });
}

module.exports = gitInfo;