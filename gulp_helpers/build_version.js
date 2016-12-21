const fs = require('fs');
const path = require('path');
const properties = require('properties');
const yargs = require('yargs');
const semver = require('semver');
const pkg = require('../package.json');

yargs
.alias('r', 'release').describe('r', 'Create a release build, not a snapshot')
.alias('v', 'version').describe('v', 'Explicitely set the version')
.describe('fallback', 'Fall back to the version in the package.json file');
const argv = yargs.argv;

const propFile = path.resolve('..', '..', '..', 'elasticsearch', 'buildSrc', 'version.properties');

function getFileVersion() {
  const snapshotText = (argv.release) ? '' : '-SNAPSHOT';

  try {
    // throws if file can not be read or found
    fs.accessSync(propFile, fs.R_OK);
    const contents = fs.readFileSync(propFile, { encoding: 'utf8' });
    const props = properties.parse(contents);
    return props.elasticsearch + snapshotText;
  } catch (e) {
    if (!argv.fallback) {
      throw new Error('Could not read version from ' + propFile + ', try using --fallback');
    }
    return pkg.version.replace(/\-snapshot/i, snapshotText);
  }
}

function getVersion() {
  const fileVersion = getFileVersion();
  // ensure valid version
  if (!argv.version) return fileVersion;
  if (!semver.valid(argv.version)) throw new Error('Version is invalid: ' + argv.version);

  // ensure version roughly matches
  const minVer = '^' + fileVersion.split('-')[0];
  const compareVer = argv.version.split('-')[0];

  if (!semver.satisfies(compareVer, minVer)) throw new Error('Version does not match ' + minVer);

  return argv.version;
}

module.exports = getVersion;
