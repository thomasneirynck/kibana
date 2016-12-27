require('babel/register')();
require('dotenv').config({ silent: true });

// relative location of Kibana install
const pathToKibana = process.env.KIBANA_PATH || '../../../kibana';

const gulp = require('gulp');
const g = require('gulp-load-plugins')();
const path = require('path');
const fs = require('fs');
const Bluebird = require('bluebird');
const del = require('del');
const prettyData = require('pretty-data');
const checksum = require('checksum');
const aws = require('aws-sdk');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const isparta = require('isparta');
const runSequence = require('run-sequence');

const logger = require('./gulp_helpers/logger');
const exec = require('./gulp_helpers/exec')(g.util);
const syncPath = require('./gulp_helpers/sync_path');
const downloadPhantom = require('./gulp_helpers/download_phantom');
const gitInfo = require('./gulp_helpers/git_info');
const stagedFiles = require('./gulp_helpers/staged_files.js');
const createPackageFile = require('./gulp_helpers/create_package');
const buildVersion = require('./gulp_helpers/build_version')();
const fileGlobs = require('./gulp_helpers/globs');
const getPlugins = require('./gulp_helpers/get_plugins');

const pkg = require('./package.json');
const packageFile = `${pkg.name}-${buildVersion}.zip`;
const checksumFile = packageFile + '.sha1.txt';

const buildDir = path.resolve(__dirname, 'build');
const builtDir = path.join(buildDir, 'plugin');
const buildTarget = path.resolve(builtDir, 'kibana', pkg.name);
const targetDir = path.resolve(__dirname, 'target');
const kibanaPluginDir = path.resolve(__dirname, pathToKibana, 'plugins', pkg.name);

const coverageDir = path.resolve(__dirname, 'coverage');

const buildIncludes = [
  '../LICENSE.txt',
  'NOTICE.txt',
  'package.json',
  'index.js',
  'node_modules',
  '.node-version',
  'plugins',
  '.phantom',
  'server'
];

const excludedSyncDeps = Object.keys(pkg.devDependencies).map(function (name) {
  return path.join('node_modules', name);
});

const excludedSyncFiles = [
  '.DS_Store',
  '__tests__',
  'README.md',
  'node_modules/.bin',
];

const syncPathTo = syncPath(excludedSyncDeps.concat(excludedSyncFiles));

gulp.task('sync', function () {
  return downloadPhantom(path.join(__dirname, '.phantom'))
  .then(function () {
    return Bluebird.mapSeries(buildIncludes, function (source) {
      return syncPathTo(source, kibanaPluginDir, {
        delete: source !== '.phantom'
      });
    });
  });
});

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

gulp.task('lint-staged', function () {
  const kibanaPath = new RegExp('^kibana/');

  return stagedFiles.getFiles(__dirname)
  .then((files) => {
    const filePaths = files
    .filter((file) => stagedFiles.getFilename(file).match(/\.jsx?$/))
    .map((file) => stagedFiles.getFilename(file).replace(kibanaPath, ''));

    return lintFiles(filePaths);
  });
});

gulp.task('lint', function () {
  const filePaths = [
    './*.js',
    './{server,gulp_helpers}/**/*.js',
  ]
  .concat(fileGlobs.forPlugins('js', 'jsx'));

  return lintFiles(filePaths);
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
    g.util.log('Version', g.util.colors.yellow(buildVersion));
    g.util.log('Build Number', g.util.colors.yellow(info.number));
    g.util.log('Build SHA', g.util.colors.yellow(info.sha));
    g.util.log('Build Output', g.util.colors.yellow(packageFile));
  });
});

gulp.task('build', ['lint', 'clean', 'report'], function () {
  const excludes = ['node_modules', 'package.json'];
  const pkgProps = ['name', 'version', 'dependencies', 'kibana'];
  const includes = buildIncludes.filter((include) => excludes.indexOf(include) === -1);

  return Bluebird.mapSeries(includes, function (source) {
    return syncPathTo(source, buildTarget, {
      delete: source !== '.phantom'
    });
  })
  .then(function () {
    return downloadPhantom(path.join(buildTarget, '.phantom'));
  })
  .then(() => createPackageFile(pkg, pkgProps, buildVersion))
  .then(function (pkgOutput) {
    // re-write package.json, stripping unimportant bits and adding build info
    const prettyOutput = prettyData.pd.json(pkgOutput);
    return fs.writeFileSync(path.join(buildTarget, 'package.json'), prettyOutput, { encoding: 'utf8' });
  })
  .then(() => {
    // re-write plugins' package.json, stripping unimportant bit and syncing version
    return gulp.src(['./plugins/*/package.json'])
    .pipe(g.jsonEditor(function (obj) {
      return Object.keys(obj).reduce(function (o, key) {
        if (pkgProps.indexOf(key) === -1) return o;
        o[key] = (key === 'version') ? buildVersion : obj[key];
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
  const targetFile = path.join(targetDir, packageFile);
  const targetChecksum = path.join(targetDir, checksumFile);

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
  const s3 = new aws.S3();

  function uploadFile(filename) {
    const params = {
      Bucket: 'download.elasticsearch.org',
      Key: 'kibana/x-pack/' + filename,
      Body: fs.createReadStream(path.join(targetDir, filename))
    };

    return Bluebird.fromCallback(function (cb) {
      return s3.upload(params, cb);
    });
  }

  const uploads = [
    packageFile,
    checksumFile
  ];

  return Bluebird.each(uploads, function (upload) {
    return uploadFile(upload)
    .then(function (result) {
      const location = result.Location.replace(/%2F/g, '/').replace('s3.amazonaws.com/', '');
      g.util.log(g.util.colors.green('Upload finished'), g.util.colors.yellow(location));
    });
  })
  .catch(function (err) {
    g.util.log(g.util.colors.red('Release Error!'), g.util.colors.yellow(err.message));
  });
});

gulp.task('pre-test', function () {
  const globs = [
    './{server,public}/**/*.js',
    '!./**/__tests__/**'
  ].concat(fileGlobs.forPlugins());

  return gulp.src(globs)
    // instruments code for measuring test coverage
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true,
      babel: {
        stage: 1 // should match https://github.com/elastic/kibana/blob/master/src/optimize/babel_options.js#L12
      }
    }))
    // force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

function runMocha() {
  const globs = [
    './server/**/__tests__/**/*.js',
    '!./build/**'
  ].concat(fileGlobs.forPluginServerTests());

  return gulp.src(globs, { read: false })
    .pipe(mocha({
      ui: 'bdd'
    }));
}

function runNpm(flags, options) {
  return exec('npm', ['run'].concat(flags), options);
}

/*
 * This requires Kibana to be cloned in the same parent directory as x-plugins
 */
function runBrowserTests(type) {
  const plugins = getPlugins();
  const kbnBrowserArgs = [
    type,
    '--',
    // TODO: re-enable SSL, pending https://github.com/elastic/kibana/pull/8855
    // '--kbnServer.server.sslEnabled', 'false', // TODO: needs support in Kibana
    `--kbnServer.tests_bundle.pluginId=${plugins.join(',')}`,
    `--kbnServer.plugin-path=${__dirname}`
  ];
  const kbnBrowserOptions = { cwd: pathToKibana };
  return runNpm(kbnBrowserArgs, kbnBrowserOptions);
}

gulp.task('test', function (cb) {
  const preTasks = ['lint', 'clean-test'];
  // TODO: enable testbrowser, pening https://github.com/elastic/x-pack/issues/4321
  runSequence(preTasks, 'testserver', /*'testbrowser',*/ cb);
});

gulp.task('testonly', ['testserver', 'testbrowser']);

gulp.task('testserver', ['pre-test'], function () {
  return runMocha().pipe(istanbul.writeReports());
});

gulp.task('testbrowser-dev', function () {
  return runBrowserTests('test:dev');
});

gulp.task('testbrowser', function () {
  return runBrowserTests('test:browser');
});

gulp.task('dev', ['sync'], function () {
  const watchFiles = [
    'package.json',
    'index.js',
    'plugins/**',
    'public/**',
    'server/**'
  ];

  gulp.watch(watchFiles, ['sync']);
});
