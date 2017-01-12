require('babel/register')();
require('dotenv').config({ silent: true });

const gulp = require('gulp');
const g = require('gulp-load-plugins')();
const path = require('path');
const del = require('del');
const isparta = require('isparta');
const runSequence = require('run-sequence');
const pluginHelpers = require('@elastic/plugin-helpers');

const logger = require('./gulp_helpers/logger');
const buildVersion = require('./gulp_helpers/build_version')();
const downloadPhantom = require('./gulp_helpers/download_phantom');
const gitInfo = require('./gulp_helpers/git_info');
const stagedFiles = require('./gulp_helpers/staged_files.js');
const fileGlobs = require('./gulp_helpers/globs');
const getPlugins = require('./gulp_helpers/get_plugins');
const getFlags = require('./gulp_helpers/get_flags');

const pkg = require('./package.json');

const buildDir = path.resolve(__dirname, 'build');
const buildTarget = path.resolve(buildDir, 'plugin');
const packageDir = path.resolve(buildDir, 'distributions');
const coverageDir = path.resolve(__dirname, 'coverage');

function lintFiles(filePaths) {
  return gulp.src(filePaths)
  // eslint() attaches the lint output to the eslint property
  // of the file object so it can be used by other modules.
  .pipe(g.eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(g.eslint.formatEach())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  .pipe(g.eslint.failAfterError());
}

gulp.task('prepare', () => downloadPhantom(path.join(__dirname, '.phantom')));

gulp.task('dev', ['prepare'], () => pluginHelpers('start', { flags: getFlags() }));


gulp.task('lint-staged', () => {
  const kibanaPath = new RegExp('^kibana/');

  return stagedFiles.getFiles(__dirname)
  .then((files) => {
    const filePaths = files
    .filter((file) => stagedFiles.getFilename(file).match(/\.jsx?$/))
    .map((file) => stagedFiles.getFilename(file).replace(kibanaPath, ''));

    return lintFiles(filePaths);
  });
});

gulp.task('lint', () => {
  const filePaths = [
    './*.js',
    './{server,gulp_helpers}/**/*.js',
  ]
  .concat(fileGlobs.forPlugins('js', 'jsx'));

  return lintFiles(filePaths);
});

gulp.task('clean-test', () => {
  logger('Deleting', coverageDir);
  return del([coverageDir]);
});

gulp.task('clean', ['clean-test'], () => {
  const toDelete = [
    buildDir,
    packageDir,
  ];
  logger('Deleting', toDelete.join(', '));
  return del(toDelete);
});

gulp.task('report', () => {
  return gitInfo()
  .then(function (info) {
    g.util.log('Package Name', g.util.colors.yellow(pkg.name));
    g.util.log('Version', g.util.colors.yellow(buildVersion));
    g.util.log('Build Number', g.util.colors.yellow(info.number));
    g.util.log('Build SHA', g.util.colors.yellow(info.sha));
  });
});

gulp.task('build', ['lint', 'clean', 'report', 'prepare'], () => {
  return pluginHelpers('build', {
    skipArchive: true,
    buildDestination: buildTarget,
  });
});

gulp.task('pre-test', () => {
  const globs = [
    './{server,public}/**/*.js',
    '!./**/__tests__/**',
  ].concat(fileGlobs.forPlugins());

  return gulp.src(globs)
    // instruments code for measuring test coverage
    .pipe(g.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true,
      babel: {
        stage: 1 // should match https://github.com/elastic/kibana/blob/master/src/optimize/babel_options.js#L12
      }
    }))
    // force `require` to return covered files
    .pipe(g.istanbul.hookRequire());
});

gulp.task('test', (cb) => {
  const preTasks = ['lint', 'clean-test'];
  // TODO: enable testbrowser, pening https://github.com/elastic/x-pack/issues/4321
  runSequence(preTasks, 'testserver', /*'testbrowser',*/ cb);
});

gulp.task('testonly', ['testserver', 'testbrowser']);

gulp.task('testserver', ['pre-test'], () => {
  const globs = [
    'server/**/__tests__/**/*.js',
  ].concat(fileGlobs.forPluginServerTests());

  return gulp.src(globs, { read: false })
  .pipe(g.mocha({ ui: 'bdd' }))
  .pipe(g.istanbul.writeReports());
});

gulp.task('testbrowser', () => {
  const plugins = getPlugins();
  return pluginHelpers('testBrowser', {
    plugins: plugins.join(','),
  });
});

gulp.task('testbrowser-dev', () => {
  const plugins = getPlugins();
  return pluginHelpers('testBrowser', {
    dev: true,
    plugins: plugins.join(','),
  });
});