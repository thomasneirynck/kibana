var fs = require('fs');
var path = require('path');
var properties = require('properties');
var yargs = require('yargs');
var semver = require('semver');
var pkg = require('../package.json');

yargs
.alias('r', 'release').describe('r', 'Create a release build, not a snapshot')
.alias('v', 'version').describe('v', 'Explicitely set the version')
.describe('fallback', 'Fall back to the version in the package.json file');
var argv = yargs.argv;

var propFile = path.resolve('..', '..', 'elasticsearch', 'buildSrc', 'version.properties');

function getFileVersion() {
  var snapshotText = (argv.release) ? '' : '-SNAPSHOT';

  try {
    // throws if file can not be read or found
    fs.accessSync(propFile, fs.R_OK);
    var contents = fs.readFileSync(propFile, { encoding: 'utf8' });
    var props = properties.parse(contents);
    return props.elasticsearch + snapshotText;
  } catch (e) {
    if (!argv.fallback) throw e;
    return pkg.version.replace(/\-snapshot/i, snapshotText);
  }
}

function getVersion() {
  var fileVersion = getFileVersion();
  // ensure valid version
  if (!argv.version) return fileVersion;
  if (!semver.valid(argv.version)) throw new Error('Version is invalid: ' + argv.version);

  // ensure version roughly matches
  var minVer = '^' + fileVersion.split('-')[0];
  var compareVer = argv.version.split('-')[0];

  if (!semver.satisfies(compareVer, minVer)) throw new Error('Version does not match ' + minVer);

  return argv.version;
}

module.exports = getVersion;