require('babel/register')();

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
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var isparta = require('isparta');

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
var builtDir = path.join(buildDir, 'plugin');
var buildTarget = path.resolve(builtDir, 'kibana', pkg.name);
var targetDir = path.resolve(__dirname, 'target');
var kibanaPluginDir = path.resolve(__dirname, pathToKibana, 'installedPlugins', pkg.name);

var coverageDir = path.resolve(__dirname, 'coverage');

var buildIncludes = [
  'LICENSE.txt',
  'NOTICE.txt',
  'package.json',
  'index.js',
  'node_modules',
  '.node-version',
  'plugins',
  '.phantom',
  // 'public',
  'server'
];

var excludedDeps = Object.keys(pkg.devDependencies).map(function (name) {
  return path.join('node_modules', name);
});

var excludedFiles = [
  '.DS_Store',
  '__test__',
  'README.md',
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
    '!plugins/**/node_modules/**',
    '!plugins/**/__test__/fixtures/**/*.js',
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

gulp.task('clean-test', function () {
  logger('Deleting', coverageDir);
  return del([coverageDir]);
});

gulp.task('clean', ['clean-test'], function () {
  const toDelete = [
    buildDir,
    targetDir,
    'plugins/**/node_modules' // elasticsearch-shield-js
  ];
  logger('Deleting', toDelete.join(', '));
  return del(toDelete);
});

gulp.task('report', function () {
  return gitInfo()
  .then(function (info) {
    g.util.log('Package Name', g.util.colors.yellow(pkg.name));
    g.util.log('Version', g.util.colors.yellow(pkg.version));
    g.util.log('Build Number', g.util.colors.yellow(info.number));
    g.util.log('Build SHA', g.util.colors.yellow(info.sha));
    g.util.log('Build Output', g.util.colors.yellow(packageFile));
  });
});

gulp.task('build', ['lint', 'clean', 'report'], function () {
  const excludes = ['node_modules', 'package.json'];
  const pkgProps = ['name', 'version', 'dependencies'];
  const includes = buildIncludes.filter((include) => excludes.indexOf(include) === -1);

  return Bluebird.mapSeries(includes, function (source) {
    return syncPathTo(source, buildTarget, source !== '.phantom');
  })
  .then(function () {
    return downloadPhantom(path.join(buildTarget, '.phantom'));
  })
  .then(() => createPackageFile(pkg, pkgProps))
  .then(function (pkgOutput) {
    // re-write package.json, stripping unimportant bits and adding build info
    var prettyOutput = prettyData.pd.json(pkgOutput);
    return fs.writeFileSync(path.join(buildTarget, 'package.json'), prettyOutput, { encoding: 'utf8' });
  })
  .then(() => {
    // re-write plugins' package.json, stripping unimportant bit and syncing version
    return gulp.src(['./plugins/*/package.json'])
    .pipe(g.jsonEditor(function (obj) {
      return Object.keys(obj).reduce(function (o, key) {
        if (pkgProps.indexOf(key) === -1) return o;
        o[key] = (key === 'version') ? pkg.version : obj[key];
        return o;
      }, {});
    }))
    .pipe(gulp.dest(path.join(buildTarget, 'plugins')));
  })
  .then(function () {
    return exec('npm', ['install', '--production', '--no-bin-links', '--silent'], { cwd: buildTarget });
  });
});

gulp.task('package', ['build'], function () {
  var targetFile = path.join(targetDir, packageFile);
  var targetChecksum = path.join(targetDir, checksumFile);

  return Bluebird.fromCallback(function (cb) {
    return gulp.src(builtDir + '/**', { dot: true })
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

gulp.task('pre-test', function () {
  return gulp.src([
    './server/**/*.js',
    './public/**/*.js',
    './plugins/**/*.js',
    '!./**/__test__/**'
  ])
    // instruments code for measuring test coverage
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    // force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

function runMocha() {
  return gulp.src(['./plugins/**/__test__/**/*.js', '!./build/**'], { read: false })
    .pipe(mocha({
      ui: 'bdd'
    }));
}

function runNpm(flags, options) {
  return exec('npm', ['run'].concat(flags), options);
}

function runBrowserTests(type) {
  var kbnBrowserArgs = [
    type,
    '--',
    '--kbnServer.tests_bundle.pluginId', 'graph,security,monitoring,reporting',
    '--kbnServer.plugin-path', __dirname
  ];
  var kbnBrowserOptions = { cwd: pathToKibana };
  return runNpm(kbnBrowserArgs, kbnBrowserOptions);
}

gulp.task('test', ['lint', 'clean-test', 'pre-test'], function () {
  return Bluebird.all([
    runBrowserTests('test:browser'),

    // generates a coverage directory with reports for finding coverage gaps
    runMocha().pipe(istanbul.writeReports())
  ]);
});


gulp.task('testonly', ['testserver', 'testbrowser']);

gulp.task('testserver', function () {
  return runMocha();
});

gulp.task('testbrowser-dev', function () {
  return runBrowserTests('test:dev');
});

gulp.task('testbrowser', function () {
  return runBrowserTests('test:browser');
});

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
