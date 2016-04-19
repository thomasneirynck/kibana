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
var aws = require('aws-sdk');

var logger = require('./gulp_helpers/logger');
var exec = require('./gulp_helpers/exec')(g.util);
var syncPath = require('./gulp_helpers/sync_path');
var downloadPhantom = require('./gulp_helpers/download_phantom');
var gitInfo = require('./gulp_helpers/git_info');
var createPackageFile = require('./gulp_helpers/create_package');

var pkg = require('./package.json');
var packageFile = `${pkg.name}-${pkg.version}.zip`;
var checksumFile = packageFile + '.sha1.txt';

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
  '.phantom',
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

var syncPathTo = syncPath(excludedDeps.concat(excludedFiles));

gulp.task('sync', function () {
  return downloadPhantom(path.join(__dirname, '.phantom'))
  .then(function () {
    return Bluebird.mapSeries(buildIncludes, function (source) {
      return syncPathTo(source, kibanaPluginDir, source !== '.phantom');
    });
  });
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
  logger('Deleting', [buildDir, targetDir].join(', '));
  return del([buildDir, targetDir]);
});

gulp.task('report', function () {
  return gitInfo()
  .then(function (info) {
    g.util.log('Package Name', g.util.colors.yellow(pkg.name));
    g.util.log('Version', g.util.colors.yellow(pkg.version));
    g.util.log('Build Number', g.util.colors.yellow(info.number));
    g.util.log('Build SHA', g.util.colors.yellow(info.sha));
  });
});

gulp.task('build', ['lint', 'clean', 'report'], function () {
  const excludes = ['node_modules', 'package.json'];
  const includes = buildIncludes.filter((include) => excludes.indexOf(include) === -1);

  return Bluebird.mapSeries(includes, function (source) {
    return syncPathTo(source, buildTarget, source !== '.phantom');
  })
  .then(function () {
    return downloadPhantom(path.join(buildTarget, '.phantom'));
  })
  .then(() => createPackageFile(pkg, ['name', 'version', 'dependencies']))
  .then(function (pkgOutput) {
    var prettyOutput = prettyData.pd.json(pkgOutput);
    return fs.writeFileSync(path.join(buildTarget, 'package.json'), prettyOutput, { encoding: 'utf8' });
  })
  .then(function () {
    return exec('npm', ['install', '--production', '--silent'], { cwd: buildTarget });
  });
});

gulp.task('package', ['build'], function () {
  var targetFile = path.join(targetDir, packageFile);
  var targetChecksum = path.join(targetDir, checksumFile);

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
      return fs.writeFileSync(targetChecksum, sum, { encoding: 'utf8' });
    });
  });
});

gulp.task('release', ['package'], function () {
  var s3 = new aws.S3();

  function uploadFile(filename) {
    var params = {
      Bucket: 'download.elasticsearch.org',
      Key: 'kibana/x-pack/' + filename,
      Body: fs.createReadStream(path.join(targetDir, filename))
    };

    return Bluebird.fromCallback(function (cb) {
      return s3.upload(params, cb);
    });
  }

  var uploads = [
    packageFile,
    checksumFile
  ];

  return Bluebird.each(uploads, function (upload) {
    return uploadFile(upload)
    .then(function (result) {
      var location = result.Location.replace(/%2F/g, '/').replace('s3.amazonaws.com/', '');
      g.util.log(g.util.colors.green('Upload finished'), g.util.colors.yellow(location));
    });
  })
  .catch(function (err) {
    g.util.log(g.util.colors.red('Release Error!'), g.util.colors.yellow(err.message));
  });
});

gulp.task('test', ['lint']);

gulp.task('dev', ['sync'], function () {
  var watchFiles = [
    'package.json',
    'index.js',
    'plugins/**',
    'public/**',
    'server/**'
  ];

  gulp.watch(watchFiles, ['sync']);
});