var fs = require('fs');
var path = require('path');
var properties = require('properties');
var pkg = require('../package.json');

var propFile = path.resolve('..', '..', 'elasticsearch', 'buildSrc', 'version.properties');

function getVersion() {
  var isSnapshot = 1;
  var snapshotText = (isSnapshot) ? '-SNAPSHOT' : '';

  try {
    // throws if file can not be read
    fs.accessSync(propFile, fs.R_OK);
    var contents = fs.readFileSync(propFile, { encoding: 'utf8' });
    var props = properties.parse(contents);
    return props.elasticsearch + snapshotText;
  } catch (e) {
    return pkg.version.replace(/\-snapshot/i, snapshotText);
  }
}

module.exports = getVersion;