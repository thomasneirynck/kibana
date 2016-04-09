require('babel-register')();

// relative location of Kibana install
var pathToKibana = '../../kibana';

var gulp = require('gulp');
var g = require('gulp-load-plugins')();
var path = require('path');
var fs = require('fs');
var Bluebird = require('bluebird');
var del = require('del');
var prettyData = require('pretty-data');
var checksum = require('checksum');

var logger = require('./gulp_helpers/logger');
var exec = require('./gulp_helpers/exec')(g.util);
var syncPaths = require('./gulp_helpers/sync_paths');

var pkg = require('./package.json');
var packageFile = `${pkg.name}-${pkg.version}.zip`;

var buildDir = path.resolve(__dirname, 'build');
var buildTarget = path.resolve(buildDir, 'kibana', pkg.name);
var targetDir = path.resolve(__dirname, 'target');
var kibanaPluginDir = path.resolve(__dirname, pathToKibana, 'installedPlugins', pkg.name);

var buildIncludes = [
  'package.json',
  'index.js',
  'node_modules',
  '.node-version',
  'plugins',
  // 'public',
  // 'server',
];

var excludedDeps = Object.keys(pkg.devDependencies).map(function (name) {
  return path.join('node_modules', name);
});

var excludedFiles = [
  '.DS_Store',
  '/**/__tests__/**',
  'node_modules/.bin',
];

var syncPathsTo = syncPaths(excludedDeps.concat(excludedFiles));

gulp.task('sync', function () {
  return syncPathsTo(buildIncludes, kibanaPluginDir);
});

gulp.task('lint', function () {
  var filePaths = [
    'gulpfile.js',
    'plugins/**/*.js',
    'plugins/**/*.jsx',
    'server/**/*.js',
    'public/**/*.js',
    '!plugins/**/test/fixtures/**/*.js',
    '!plugins/graph/**',
  ];

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
});

gulp.task('clean', function () {
  return del([buildDir, targetDir]);
});

gulp.task('build', ['lint', 'clean'], function () {
  const excludes = ['node_modules', 'package.json'];
  const includes = buildIncludes.filter((include) => excludes.indexOf(include) === -1);
  return syncPathsTo(includes, buildTarget)
  .then(function () {
    // create new package.json
    var includeProps = ['name', 'version', 'dependencies'];
    var pkgOutput = includeProps.reduce(function (output, key) {
      output[key] = pkg[key];
      return output;
    }, {});

    var prettyOutput = prettyData.pd.json(pkgOutput);
    return fs.writeFileSync(path.join(buildTarget, 'package.json'), prettyOutput, { encoding: 'utf8' });
  })
  .then(function () {
    return exec('npm', ['install', '--production', '--silent'], { cwd: buildTarget });
  });
});

gulp.task('package', ['build'], function () {
  var targetFile = path.join(targetDir, packageFile);
  var checksumFile = path.join(targetDir, packageFile + '.sha1.txt');

  return Bluebird.fromCallback(function (cb) {
    return gulp.src(buildDir + '/**', { dot: true })
    .pipe(g.zip(packageFile))
    .pipe(gulp.dest(targetDir))
    .on('finish', cb)
    .on('error', cb);
  })
  .then(function () {
    return Bluebird.fromCallback(function (cb) {
      checksum.file(targetFile, cb);
    })
    .then(function (sum) {
      logger('Package checksum', sum);
      return fs.writeFileSync(checksumFile, sum, { encoding: 'utf8' });
    });
  });
});

gulp.task('dev', ['sync'], function () {
  var watchFiles = [
    'package.json',
    'index.js',
    'plugins/**',
    'public/**',
    'server/**'
  ];

  gulp.watch(watchFiles, ['sync', 'lint']);
});