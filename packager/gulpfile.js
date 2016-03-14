var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var Promise = require('bluebird');
var del = require('del');
var checksum = require('checksum');
var debug = require('debug')('packager');
var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var g = require('gulp-load-plugins')();

var pkg = require('./package.json');
var buildDir = path.resolve(__dirname, 'build');
var targetDir = path.resolve(__dirname, 'target');
var buildTarget = path.join(buildDir, 'kibana', pkg.packageName);
var packageFile = pkg.packageName + '.tar.gz';

var ignoredPlugins = ['i', 'ignore'].reduce(function (ignore, key) {
  if (typeof argv[key] === 'string') ignore = ignore.concat(argv[key].split(','));
  return ignore;
}, []).concat(path.basename(__dirname));

var plugins = getPlugins();

var templateData = {
  plugins: plugins,
  name: pkg.packageName,
  version: pkg.version,
  author: pkg.author,
};

gulp.task('build', ['show-plugins', 'prepare-builds'], runBuild);

gulp.task('build-only', ['show-plugins'], runBuild);

gulp.task('package', ['build'], runPackage);

gulp.task('package-only', runPackage);

gulp.task('clean', function () {
  return del([buildDir, targetDir]);
});

gulp.task('prepare-builds', function () {
  return Promise.mapSeries(plugins, function (plugin) {
    debug('Resetting node modules', plugin.path);
    var modules = path.resolve(plugin.path, 'node_modules');
    g.util.log(g.util.colors.cyan(plugin.name), 'Preparing for build, this will take a moment');

    return del(modules, { force: true })
    .then(function () {
      return exec(plugin.name, 'npm', ['install', '--silent'], { cwd: plugin.path })
    });
  });
});

gulp.task('show-plugins', function () {
  g.util.log('Pack name:', g.util.colors.yellow(templateData.name));
  g.util.log('Pack version:', g.util.colors.yellow(templateData.version));
  g.util.log('Bundling plugins:', g.util.colors.yellow(plugins.map(plugin => plugin.name).join(', ')));
});

function runBuild() {
  debug('Creating the build', buildDir);
  return del(buildDir, { force: true })
  .then(function () {
    return Promise.mapSeries(plugins, function (plugin) {
      g.util.log(g.util.colors.cyan(plugin.name), 'Building');
      return exec(plugin.name, 'npm', ['run', 'build'], { cwd: plugin.path })
      .then(function () {
        return Promise.fromCallback(function (cb) {
          var buildPath = path.resolve(plugin.path, 'build');

          var stream = gulp.src(path.join(buildPath, '**'))
          .pipe(gulp.dest(buildTarget))
          .on('finish', cb)
          .on('error', cb);
        })
      });
    })
    .then(createEntry);
  });
}

function runPackage() {
  debug('Creating the package', targetDir);
  return del(targetDir, { force: true })
  .then(function () {
    return Promise.fromCallback(function (cb) {
      return gulp.src(path.join(buildDir, '**', '*'))
      .pipe(g.tar(packageFile))
      .pipe(g.gzip({ append: false }))
      .pipe(gulp.dest(path.join(targetDir)))
      .on('finish', cb)
      .on('error', cb);
    });
  })
  .then(function () {
    return Promise.fromCallback(function (cb) {
      checksum.file(path.join(targetDir, packageFile), cb);
    });
  })
  .then(function (checksum) {
    debug('Package checksum', checksum);
    var target = path.join(targetDir, packageFile + '.sha1.txt');
    return fs.writeFileSync(target, checksum, { encoding: 'utf8' });
  });
}

function createEntry() {
  debug('Creating entry files');
  return Promise.fromCallback(function (cb) {
    var templatePath = path.resolve(__dirname, 'templates');
    var s = gulp.src(path.join(templatePath, '*.*'))
    .pipe(g.template(templateData))
    .pipe(gulp.dest(buildTarget))
    .on('finish', cb)
    .on('error', cb);
  });
}

function getPlugins() {
  var plugins = fs.readdirSync('..')
  .map(function (item) {
    if (~ignoredPlugins.indexOf(item) < 0) return false;

    var filepath = path.resolve(__dirname, '..', item);
    var stats = fs.lstatSync(filepath);
    return !stats.isDirectory() ? false : {
      name: item,
      path: filepath,
    };
  })
  .filter(Boolean);

  return plugins;
}

function exec(prefix, cmd, args, opts) {
  debug('exec', { cmd, args, opts });
  args = args || [];
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    var proc = child_process.spawn(cmd, args, opts);

    proc.stdout.on('data', function (data) {
      debug(g.util.colors.green(prefix), data.toString('utf-8').trim());
    });

    proc.stderr.on('data', function (data) {
      g.util.log(g.util.colors.red(prefix), data.toString('utf-8').trim());
    });

    proc.on('error', function (err) {
      reject(err);
    });

    proc.on('close', function (code) {
      if (code !== 0) reject(new Error('Process exited with code ' + code));
      resolve();
    });
  });
}
