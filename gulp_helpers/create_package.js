var path = require('path');
var Bluebird = require('bluebird');
var simpleGit = require('simple-git');
var moment = require('moment');
var gitDir = path.resolve(__dirname, '..');

function createPackageFile(pkg, includeProps) {
  // create object for new package.json
  var pkgOutput = includeProps.reduce(function (output, key) {
    output[key] = pkg[key];
    return output;
  }, {});

  // append the current commit sha
  var git = simpleGit(gitDir);
  return Bluebird.fromCallback(function (cb) {
    git.log(cb);
  })
  .then(function (log) {
    var m = moment.utc();
    pkgOutput.build = {
      number: log.total,
      sha: log.latest.hash,
      date: m.format()
    };
    return pkgOutput;
  });
}

module.exports = createPackageFile;