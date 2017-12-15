require('@elastic/plugin-helpers').babelRegister();
require('dotenv').config({ silent: true });

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const g = require('gulp-load-plugins')();
const path = require('path');
const del = require('del');
const isparta = require('isparta');
const runSequence = require('run-sequence');
const pluginHelpers = require('@elastic/plugin-helpers');
const argv = require('yargs').argv;

const logger = require('./gulp_helpers/logger');
const buildVersion = require('./gulp_helpers/build_version')();
const downloadBrowsers = require('./gulp_helpers/download_browsers');
const gitInfo = require('./gulp_helpers/git_info');
const stagedFiles = require('./gulp_helpers/staged_files.js');
const fileGlobs = require('./gulp_helpers/globs');
const getPlugins = require('./gulp_helpers/get_plugins');
const getFlags = require('./gulp_helpers/get_flags');

const pkg = require('./package.json');
const browsers = require('./plugins/reporting/export_types/printable_pdf/server/lib/browsers').browsers;
const { createAutoJunitReporter } = require(pluginHelpers.resolveKibanaPath('src/dev'));

const buildDir = path.resolve(__dirname, 'build');
const buildTarget = path.resolve(buildDir, 'plugin');
const packageDir = path.resolve(buildDir, 'distributions');
const coverageDir = path.resolve(__dirname, 'coverage');

const MOCHA_OPTIONS = {
  ui: 'bdd',
  reporter: createAutoJunitReporter({
    reportName: 'X-Pack Mocha Tests',
    rootDirectory: __dirname,
  }),
};

const skipTestCoverage = argv['test-coverage'] && argv['test-coverage'] === 'skip';

function isFixed(file) {
  // Has ESLint fixed the file contents?
  return file.eslint && file.eslint.fixed;
}

function lintFiles(filePaths) {
  const isAutoFix = (argv.fixLint === undefined) ? false : true;
  return gulp.src(filePaths, {
    base: __dirname,
  })
  // eslint() attaches the lint output to the eslint property
  // of the file object so it can be used by other modules.
  .pipe(g.eslint({
    fix: isAutoFix,
  }))
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(g.eslint.formatEach())
  .pipe(gulpIf(isFixed, gulp.dest('./')))
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  .pipe(g.eslint.failAfterError());
}

gulp.task('prepare', () => downloadBrowsers(browsers));

gulp.task('dev', ['prepare'], () => pluginHelpers.run('start', { flags: getFlags() }));

gulp.task('lint-staged', () => {
  const kibanaPath = new RegExp('^kibana/');

  return stagedFiles.getFiles(__dirname)
  .then((files) => {
    // including the period in the extension allows whole names (e.g., build.gradle) to be whitelisted
    const whitelist = [
      '\.node-version',
      '\.nvmrc',
      '\.asciidoc',
      '\.css',
      '\.gradle',
      '\.gz',
      '\.html',
      '\.jpg',
      '\.js',
      '\.js\.snap',
      '\.json',
      '\.less',
      '\.md',
      '\.png',
      '\.svg',
      '\.yml' // rename .yaml to .yml if you run into this; don't add .yaml
    ];

    // build's a regex like: /(\.js|\.html|\.less|\.css)$/
    const acceptableFileExtensions = whitelist.join('|');
    const whitelistRegex = new RegExp(`(${acceptableFileExtensions})$`);

    const filePaths = files
    .map((file) => stagedFiles.getFilename(file).replace(kibanaPath, ''));

    // anything NOT whitelisted needs to be blocked
    const unwhitelistedFilePaths = filePaths.filter((file) => !file.match(whitelistRegex));

    // we need to block the unrecognized files
    if (unwhitelistedFilePaths.length) {
      // add each unique extension
      const extensionsSet = new Set(unwhitelistedFilePaths.map((file) => file.substr(file.lastIndexOf('.') + 1)));

      // log any unique extension
      g.util.log(`Unrecognized file extensions detected: [ ${Array.from(extensionsSet).join(', ')} ]`);
      // fail the pre-commit check
      throw new Error(`Files with unrecognized extensions: [ ${unwhitelistedFilePaths.join(', ')} ]`);
    }

    // we only lint Javascript files
    return lintFiles(filePaths.filter((file) => file.match(/\.js$/)));
  });
});

gulp.task('lint', () => {
  const filePaths = [
    './*.js',
    './{gulp_helpers,server,test}/**/*.js',
  ]
  .concat(fileGlobs.forPluginServerTests())
  .concat(fileGlobs.forPlugins());

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
  return pluginHelpers.run('build', {
    skipArchive: true,
    buildDestination: buildTarget,
  });
});

gulp.task('pre-test', () => {
  const globs = [
    './{common,server,public}/**/*.js',
    '!./**/__tests__/**',
  ].concat(fileGlobs.forPlugins());

  if (skipTestCoverage) {
    return gulp.src(globs);
  }

  return gulp.src(globs)
    // instruments code for measuring test coverage
    .pipe(g.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true,
      babel: {
        presets: [
          require(pluginHelpers.resolveKibanaPath('src/babel-preset/node'))
        ]
      },
    }))
    // force `require` to return covered files
    .pipe(g.istanbul.hookRequire());
});

gulp.task('test', (cb) => {
  const preTasks = ['lint', 'clean-test'];
  runSequence(preTasks, 'testserver', 'testbrowser', cb);
});

gulp.task('testonly', ['testserver', 'testbrowser']);

gulp.task('testserver', ['pre-test'], () => {
  const globs = [
    'common/**/__tests__/**/*.js',
    'server/**/__tests__/**/*.js',
  ].concat(fileGlobs.forPluginServerTests());

  if (skipTestCoverage) {
    return gulp.src(globs, { read: false })
    .pipe(g.mocha(MOCHA_OPTIONS));
  }

  return gulp.src(globs, { read: false })
  .pipe(g.mocha(MOCHA_OPTIONS))
  .pipe(g.istanbul.writeReports());
});

gulp.task('testbrowser', () => {
  const plugins = getPlugins();
  return pluginHelpers.run('testBrowser', {
    plugins: plugins.join(','),
  });
});

gulp.task('testbrowser-dev', () => {
  const plugins = getPlugins();
  return pluginHelpers.run('testBrowser', {
    dev: true,
    plugins: plugins.join(','),
  });
});
