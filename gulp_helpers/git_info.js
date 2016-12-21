const path = require('path');
const Bluebird = require('bluebird');
const simpleGit = require('simple-git');
const gitDir = path.resolve(__dirname, '..');

function gitInfo() {
  const git = simpleGit(gitDir);
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