var gitInfo = require('./git_info');
var moment = require('moment');

function createPackageFile(pkg, includeProps) {
  // create object for new package.json
  var pkgOutput = includeProps.reduce(function (output, key) {
    output[key] = pkg[key];
    return output;
  }, {});

  // append the current commit sha
  return gitInfo()
  .then(function (info) {

    var m = moment.utc();
    pkgOutput.build = {
      number: info.number,
      sha: info.sha,
      date: m.format()
    };
    return pkgOutput;
  });
}

module.exports = createPackageFile;