var fs = require('fs');
var path = require('path');
var properties = require('properties');
var yargs = require('yargs');
var pkg = require('../package.json');

yargs
.alias('r', 'release').describe('r', 'Create a release build, not a snapshot')
var argv = yargs.argv;

var propFile = path.resolve('..', '..', 'elasticsearch', 'buildSrc', 'version.properties');

function getVersion() {
  var snapshotText = (argv.release) ? '' : '-SNAPSHOT';

  try {
    // throws if file can not be read or found
    fs.accessSync(propFile, fs.R_OK);
    var contents = fs.readFileSync(propFile, { encoding: 'utf8' });
    var props = properties.parse(contents);
    return props.elasticsearch + snapshotText;
  } catch (e) {
    return pkg.version.replace(/\-snapshot/i, snapshotText);
  }
}

module.exports = getVersion;