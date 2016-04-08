require('babel-register')();

var path = require('path');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');

var gulp = require('gulp');
var g = require('gulp-load-plugins')();

var pkg = require('./package.json');
// var packageName = pkg.name  + '-' + pkg.version;

// relative location of Kibana install
var pathToKibana = '../../kibana';

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
  '.*',
  '.DS_Store',
  path.join('node_modules', '.bin'),
  // path.join('.phantom', 'phantomjs*'),
];

function syncPluginTo(dest) {
  return Promise.fromCallback(function (cb) {
    mkdirp(dest, cb);
  })
  .then(function () {
    var source = path.resolve(__dirname) + '/';
    var rsync = new Rsync();

    rsync.source(source).destination(dest);
    rsync.flags('uav').recursive(true).set('delete');
    rsync.include(buildIncludes);
    rsync.exclude(excludedDeps.concat(excludedFiles));

    // debugging
    // rsync.output((data) => console.log(data.toString('utf-8').trim()));

    return Promise.fromCallback(function (cb) {
      rsync.execute(cb);
    });
  });
}

gulp.task('sync', function () {
  return syncPluginTo(kibanaPluginDir);
});

gulp.task('lint', function () {
  var filePaths = [
    'gulpfile.js',
    'plugins/**/server/**/*.js',
    'plugins/**/public/**/*.js',
    'plugins/**/public/**/*.jsx',
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
