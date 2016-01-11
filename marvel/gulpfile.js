require('babel/register');

var gulp = require('gulp');
var _ = require('lodash');
var path = require('path');
var elasticsearch = require('elasticsearch');
var yargs = require('yargs').argv;
var gulpUtil = require('gulp-util');
var path = require('path');
var mkdirp = require('mkdirp');
var Rsync = require('rsync');
var moment = require('moment');
var uuid = require('node-uuid');
var Promise = require('bluebird');
var eslint = require('gulp-eslint');
var rimraf = require('rimraf');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
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
var kibanaPluginDir = path.resolve(require('./server/lib/kibana_home_dir').dev, 'installedPlugins/marvel');

var fakeClusterState = require('./indexer/fake_cluster_state');
var indexRecovery = require('./indexer/index_recovery');
var indexClusterState = require('./indexer/index_cluster_state');
var indexClusterStats = require('./indexer/index_cluster_stats');
var indexNodeStats = require('./indexer/index_node_stats');
var indexIndexStats = require('./indexer/index_index_stats');
var indexIndicesStats = require('./indexer/index_indices_stats');
var indexShards = require('./indexer/index_shards');
var marvelIndexTemplate = require('./marvel_index_template.json');
var createLicenseDoc = require('./indexer/create_license_doc');

function index(done) {
  var host = yargs.elasticsearch || 'localhost:9200';
  var marvel = yargs.marvel || 'localhost:9200';
  var licenseType = yargs.license || 'trial';
  var expires = yargs.expires && moment(yargs.expires) || moment().add(356, 'days');
  var interval = 5000;
  var client = new elasticsearch.Client({ requestTimeout: 120000, host: host });
  var marvelClient = new elasticsearch.Client({ requestTimeout: 120000, host: marvel });
  var clusterState;
  if (yargs.medium || yargs.gigantic) {
    if (yargs.gigantic) {
      clusterState = fakeClusterState({ indices: 800, nodes: 100 }) || false;
    }
    if (yargs.medium) {
      clusterState = fakeClusterState({ indices: 100, nodes: 20 }) || false;
    }
  }
  marvelClient.indices.putTemplate({ name: 'marvel', body: marvelIndexTemplate })
  .then(function () {
    var overrides = {
      type: licenseType,
      expiry_date_in_millis: expires.valueOf(),
      issue_date_in_millis: expires.clone().subtract(356, 'days').valueOf()
    };
    return createLicenseDoc(client, marvelClient, overrides, clusterState);
  })
  .then(function () {
    function index() {
      var start = moment.utc().valueOf();
      gulpUtil.log('Starting', gulpUtil.colors.cyan('index'));
      if (clusterState) {
        clusterState.state_uuid = uuid.v4();
        clusterState.version++;
      }
      var bulks = [];
      return Promise.each([
        indexClusterState,
        indexShards,
        indexClusterStats,
        indexIndicesStats,
        indexNodeStats,
        indexIndexStats,
        indexRecovery
      ], function (fn) {
        return fn(bulks, client, marvelClient, clusterState);
      })
      .then(function () {
        var numberOfSets = Math.ceil(bulks.length / 200);
        var sets = [];
        for (var n = 0; n < numberOfSets; n++) {
          sets.push(bulks.splice(0,200));
        }
        return Promise.each(sets, function (set) {
          return marvelClient.bulk({ body: set });
        });
      })
      .then(function () {
        var end = moment.utc().valueOf();
        gulpUtil.log('Finishing', gulpUtil.colors.cyan('index'), 'after', gulpUtil.colors.magenta((end - start) + ' ms'));
        setTimeout(index, interval);
      })
      .catch(function (err) {
        gulpUtil.log(err.stack);
        setTimeout(index, interval);
      });
    }
    index();
  })
  .catch(done);
}
gulp.task('index', index);

// paths to sync over to the kibana plugin dir
var include = [
  'LICENSE.txt',
  'NOTICE.txt',
  'package.json',
  'index.js',
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
    .pipe(eslint.failOnError());
});

function doClean(sources, done) {
  Promise.each(sources, function (dir) {
    return new Promise(function (resolve, reject) {
      rimraf(dir, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }).nodeify(done);
}
gulp.task('clean-build', function (done) {
  doClean([buildDir, targetDir], done);
});
gulp.task('clean-test', function (done) {
  doClean([coverageDir], done);
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

gulp.task('package', ['build'], function (done) {
  return gulp.src(path.join(buildDir, '**', '*'))
    .pipe(tar(packageName + '.tar'))
    .pipe(gzip())
    .pipe(gulp.dest(targetDir));
});

gulp.task('release', ['package'], function (done) {
  var filename = packageName + '.tar.gz';
  var key = 'elasticsearch/marvel/';
  if (yargs.latest) {
    key += 'marvel-latest.tar.gz';
  } else {
    key += filename;
  }
  var s3 = new aws.S3();
  var params = {
    Bucket: 'download.elasticsearch.org',
    Key: key,
    Body: fs.createReadStream(path.join(targetDir, filename))
  };
  s3.upload(params, function (err, data) {
    if (err) return done(err);
    gulpUtil.log('Finished', gulpUtil.colors.cyan('uploaded') + ' Available at ' + data.Location);
    done();
  });
});

gulp.task('dev', ['sync'], function (done) {
  gulp.watch(['package.json', 'index.js', 'public/**/*', 'server/**/*', 'test/**/*'], ['sync', 'lint']);
});

gulp.task('pre-test', function (done) {
  return gulp.src([kibanaPluginDir + '/server/**/*.js', '!' + kibanaPluginDir + '/**/__test__/**'])
    // instruments code for measuring test coverage
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    // force `require` to return covered files
    .pipe(istanbul.hookRequire());
});
gulp.task('test', ['lint', 'clean-test', 'sync', 'pre-test'], function (done) {
  return gulp.src([kibanaPluginDir + '/**/__test__/**/*.js'], { read: false })
    // runs the unit tests
    .pipe(mocha({
      ui: 'bdd'
    }))
    // generates a coverage directory with reports for finding coverage gaps
    .pipe(istanbul.writeReports());
});
