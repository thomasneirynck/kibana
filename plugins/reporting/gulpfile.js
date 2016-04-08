require('babel-register')();

var fs = require('fs');
var path = require('path');
var url = require('url');
var Promise = require('bluebird');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');
var rimraf = require('rimraf');
var gulp = require('gulp');
var gutil = require('gulp-util');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');
var request = require('request');
var md5 = require('md5');

var pkg = require('./package.json');
var packageName = pkg.name  + '-' + pkg.version;

// relative location of Kibana install
var pathToKibana = '../../../kibana';

var buildDir = path.resolve(__dirname, 'build');
var buildTarget = path.resolve(buildDir, pkg.name);
var targetDir = path.resolve(__dirname, 'target');
var kibanaPluginDir = path.resolve(__dirname, pathToKibana, 'installedPlugins', pkg.name);

var include = [
  'package.json',
  'index.js',
  'node_modules',
  'public',
  'server',
  '.phantom',
];

var excludedDeps = Object.keys(pkg.devDependencies).map(function (name) {
  return path.join('node_modules', name);
});

var excludedFiles = [
  '.DS_Store',
  path.join('node_modules', '.bin'),
  // path.join('.phantom', 'phantomjs*'),
];

function syncPluginTo(dest) {
  return Promise.fromCallback(function (cb) {
    mkdirp(dest, cb);
  })
  .then(function () {
    return Promise.all(include.map(function (name) {
      var source = path.resolve(__dirname, name);

      return Promise.fromCallback(function (cb) {
        var rsync = new Rsync();

        rsync.source(source).destination(dest);
        rsync.flags('uav').recursive(true).set('delete');
        rsync.exclude(excludedDeps.concat(excludedFiles));

        // debugging output
        rsync.output(function (data) {
          // console.log(data.toString('utf-8').trim());
        });

        rsync.execute(cb);
      });
    }));
  });
}

function fetchBinaries(dest) {
  var phantomDest = path.resolve(dest, '.phantom');
  var phantomBinaries = [{
    description: 'Windows',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-windows.zip',
    checksum: 'c5eed3aeb356ee597a457ab5b1bea870',
  }, {
    description: 'Max OS X',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-macosx.zip',
    checksum: 'fb850d56c033dd6e1142953904f62614',
  }, {
    description: 'Linux x86_64',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2',
    checksum: '4ea7aa79e45fbc487a63ef4788a18ef7',
  }, {
    description: 'Linux x86',
    url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-i686.tar.bz2',
    checksum: '814a438ca515c6f7b1b2259d0d5bc804',
  }];


  var downloads = phantomBinaries.reduce(function (chain, binary) {
    var params = url.parse(binary.url);
    var filename = params.pathname.split('/').pop();
    var filepath = path.join(phantomDest, filename);

    // verify the download checksum
    var verifyChecksum = function (filepath, cb) {
      fs.readFile(filepath, function (err, buf) {
        if (err) return cb(err);
        if (binary.checksum !== md5(buf)) return cb(binary.description + ' checksum failed');
        cb();
      });
    };

    return chain.delay(4).then(function () {
      return Promise.fromCallback(function (cb) {
        verifyChecksum(filepath, cb);
      })
      .catch(function (err) {
        return Promise.fromCallback(function (cb) {
          var ws = fs.createWriteStream(filepath)
          .on('finish', function () {
            verifyChecksum(filepath, cb);
          });

          // download binary, stream to destination
          request(binary.url)
          .on('error', cb)
          .pipe(ws);
        });
      });
    });
  }, Promise.resolve());

  return downloads;
}

gulp.task('sync', function () {
  return syncPluginTo(kibanaPluginDir);
});

gulp.task('lint', function () {
  var filePaths = [
    'gulpfile.js',
    'server/**/*.js',
    'public/**/*.js',
    'public/**/*.jsx',
    'test/**/*.js',
    '!test/fixtures/**/*.js',
  ];

  return gulp.src(filePaths)
  // eslint() attaches the lint output to the eslint property
  // of the file object so it can be used by other modules.
  .pipe(eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(eslint.formatEach())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  .pipe(eslint.failAfterError());
});

gulp.task('test', ['lint'], function () {
  return gulp.src([
    'test/**/*.js',
    '!test/fixtures/**/*.js',
  ], {read: false})
  .pipe(mocha({ reporter: 'dot' }));
});

gulp.task('clean', function (done) {
  return Promise.each([buildDir, targetDir], function (dir) {
    return Promise.fromCallback(function (cb) {
      rimraf(dir, cb);
    });
  });
});

gulp.task('build', ['clean'], function () {
  // sync files ot build
  return syncPluginTo(buildTarget)
  .then(function () {
    // download phantom binaries
    return fetchBinaries(buildTarget);
  });
});

gulp.task('package', ['build'], function () {
  return gulp.src(path.join(buildDir, '**', '*'))
  .pipe(tar(packageName + '.tar'))
  .pipe(gzip())
  .pipe(gulp.dest(targetDir));
});

gulp.task('dev', ['sync'], function () {
  gulp.watch(['package.json', 'index.js', 'public/**/*', 'server/**/*'], ['sync', 'lint']);
});
