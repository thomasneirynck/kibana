require('babel/register');

var gulp = require('gulp');
var g = require('gulp-load-plugins')();
var path = require('path');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');
var Promise = require('bluebird');
var del = require('del');
var isparta = require('isparta');
var aws = require('aws-sdk');
var fs = require('fs');
var exec = require('child_process').execSync;

var pkg = require('./package.json');
var packageName = pkg.name  + '-' + pkg.version;

var buildDir = path.resolve(__dirname, 'build');
var targetDir = path.resolve(__dirname, 'target');
var buildTarget = path.resolve(buildDir, pkg.name);
var coverageDir = path.resolve(__dirname, 'coverage');
var xpackBuildDir = path.resolve('../packager/build/kibana/xpack/monitoring');

// paths to sync over to the kibana plugin dir
var include = [
  'LICENSE.txt',
  'NOTICE.txt',
  'package.json',
  'public',
  'node_modules',
  'server',
  'webpackShims'
];
// paths to filter from include paths
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
        rsync.execute(function (syncErr) {
          if (syncErr) {
            console.log(syncErr);
            return reject(syncErr);
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
  syncPluginTo(xpackBuildDir, done);
});

gulp.task('lint', function () {
  return gulp.src(['*.js', 'server/**/*.js', 'public/**/*.js', 'public/**/*.jsx', 'gulp-tasks/**/*.jsx'])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
    .pipe(g.eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(g.eslint.formatEach())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
    .pipe(g.eslint.failOnError());
});

gulp.task('clean-build', function () {
  return del([buildDir, targetDir]);
});
gulp.task('clean-test', function () {
  return del([coverageDir]);
});
gulp.task('clean', ['clean-build', 'clean-test']);

gulp.task('build', ['clean-build'], function (done) {
  syncPluginTo(buildTarget, function (err) {
    if (err) return done(err);
    var pkgJsonFilename = path.resolve(buildTarget, 'package.json');
    var buildSha = String(exec('git rev-parse HEAD')).trim();
    var buildNum = parseFloat(String(exec('git log --format="%h" | wc -l')).trim());
    var pkgJson = require(pkgJsonFilename);
    pkgJson.build = { number: buildNum, sha: buildSha };
    fs.writeFile(pkgJsonFilename, JSON.stringify(pkgJson, null, ' '), 'utf8', done);
  });
});

gulp.task('package', ['build'], function () {
  return gulp.src(path.join(buildDir, '**', '*'))
    .pipe(g.tar(packageName + '.tar'))
    .pipe(g.gzip())
    .pipe(gulp.dest(targetDir));
});

gulp.task('release', ['package'], function (done) {
  var s3 = new aws.S3();
  var locations = [];

  function uploadFile(filename) {
    var key = 'elasticsearch/monitoring/' + filename;
    var params = {
      Bucket: 'download.elasticsearch.org',
      Key: key,
      Body: fs.createReadStream(path.join(targetDir, filename))
    };
    return new Promise(function (resolve, reject) {
      s3.upload(params, function (err, data) {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  Promise.each([
    uploadFile(packageName + '.tar.gz'),
  ], function (result) {
    locations.push(result.Location);
  }).then(function () {
    locations.forEach(function (location) {
      g.util.log('Finished', g.util.colors.cyan('uploaded') + ' Available at ' + location);
    });
    done();
  })
  .catch(function (err) {
    g.util.log('Release Error!', err.stack);
    done();
  });
});

gulp.task('dev', ['sync'], function () {
  gulp.watch(['package.json', 'index.js', 'public/**/*', 'server/**/*', 'test/**/*'], ['sync', 'lint']);
});

gulp.task('pre-test', function () {
  return gulp.src(['./server/**/*.js', '!./**/__test__/**'])
    // instruments code for measuring test coverage
    .pipe(g.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    // force `require` to return covered files
    .pipe(g.istanbul.hookRequire());
});

gulp.task('test', ['lint', 'clean-test', 'pre-test'], function () {
  return gulp.src(['./**/__test__/**/*.js', '!./build/**'], { read: false })
    // runs the unit tests
    .pipe(g.mocha({
      ui: 'bdd'
    }))
    // generates a coverage directory with reports for finding coverage gaps
    .pipe(g.istanbul.writeReports());
});

gulp.task('index', require('./gulp-tasks/indexer.js')(g));
