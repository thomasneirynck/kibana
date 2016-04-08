require('babel-register')({
  presets: ['es2015']
});

var gulp = require('gulp');
var _ = require('lodash');
var path = require('path');
var gulpUtil = require('gulp-util');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');
var Promise = require('bluebird');
var eslint = require('gulp-eslint');
var rimraf = require('rimraf');
var hashsum = require('gulp-hashsum');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');
var mocha = require('gulp-mocha');
var aws = require('aws-sdk');
var fs = require('fs');

var pkg = require('./package.json');
var packageName = pkg.name  + '-' + pkg.version;

var buildDir = path.resolve(__dirname, 'build');
var targetDir = path.resolve(__dirname, 'target');
var buildTarget = path.resolve(buildDir, pkg.name);
var kibanaPluginDir = path.resolve(__dirname, '../../../kibana/installedPlugins/' + pkg.name);

var include = [
  'webpackShims',
  'package.json',
  'index.js',
  'node_modules',
  'public',
  'server'
];
var exclude = Object.keys(pkg.devDependencies).map(function (name) {
  return path.join('node_modules', name);
});

function syncPluginTo(dest, done) {
  mkdirp(dest, function (err) {
    if (err) return done(err);
    Promise.all(include.map(function (name) {
      var source = path.resolve(__dirname, name);
      return new Promise(function (resolve, reject) {
        var rsync = new Rsync();
        rsync
          .source(source)
          .destination(dest)
          .flags('uav')
          .recursive(true)
          .set('delete')
          .exclude(exclude)
          .output(function (data) {
            process.stdout.write(data.toString('utf8'));
          });
        rsync.execute(function (err) {
          if (err) {
            console.log(err);
            return reject(err);
          }
          resolve();
        });
      });
    }))
    .then(function () {
      done();
    })
    .catch(done);
  });
}

gulp.task('sync', function (done) {
  syncPluginTo(kibanaPluginDir, done);
});

gulp.task('lint', function (done) {
  return gulp.src(['server/**/*.js', 'public/**/*.js', 'public/**/*.jsx'])
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
  Promise.each([buildDir, targetDir], function (dir) {
    return new Promise(function (resolve, reject) {
      rimraf(dir, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }).nodeify(done);
});

gulp.task('build', ['clean'], function (done) {
  syncPluginTo(buildTarget, done);
});

gulp.task('archive', ['build'], function (done) {
  return gulp.src(path.join(buildDir, '**', '*'))
    .pipe(tar(packageName + '.tar'))
    .pipe(gzip())
    .pipe(gulp.dest(targetDir));
});

gulp.task('package', ['archive'], function (done) {
  return gulp.src([path.join(targetDir, packageName + '.tar.gz')])
    .pipe(hashsum({dest: targetDir, filename: packageName + '.tar.gz.sha1.txt'}));
});

gulp.task('release', ['package'], function (done) {
  var s3 = Promise.promisifyAll(new aws.S3());
  return Promise.map([
    packageName + '.tar.gz',
    packageName + '.tar.gz.sha1.txt'
  ], function (filename) {
    var key = 'kibana/security/' + filename;
    var params = {
      Bucket: 'download.elasticsearch.org',
      Key: key,
      Body: fs.createReadStream(path.join(targetDir, filename))
    };
    return s3.uploadAsync(params).then(function (data) {
      gulpUtil.log('Finished', gulpUtil.colors.cyan('uploaded') + ' Available at ' + data.Location);
    });
  });
});

gulp.task('dev', ['sync'], function (done) {
  gulp.watch(['package.json', 'index.js', 'public/**/*', 'server/**/*'], ['sync', 'lint']);
});


