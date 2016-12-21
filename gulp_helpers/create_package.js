const gitInfo = require('./git_info');
const moment = require('moment');

function createPackageFile(pkg, includeProps, buildVersion) {
  // create object for new package.json
  const pkgOutput = includeProps.reduce(function (output, key) {
    if (buildVersion && key === 'version') output[key] = buildVersion;
    else output[key] = pkg[key];
    return output;
  }, {});

  // append the current commit sha
  return gitInfo()
  .then(function (info) {

    const m = moment.utc();
    pkgOutput.build = {
      number: info.number,
      sha: info.sha,
      date: m.format()
    };
    return pkgOutput;
  });
}

module.exports = createPackageFile;