require('babel/register')();

var gulp = require('gulp');
//var gulpUtil = require('gulp-util');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var path = require('path');
var del = require('del');
var isparta = require('isparta');

// var indexer = require('./gulp-tasks/indexer');

var coverageDir = path.resolve(__dirname, 'coverage');

gulp.task('lint', function () {
  var sourceFiles = [
    '*.js',
    'server/**/*.js',
    'public/**/*.js',
    'public/**/*.jsx',
    'gulp-tasks/**/*.js'
  ];

  return gulp.src(sourceFiles)
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

gulp.task('clean-test', function () {
  return del([coverageDir]);
});

gulp.task('clean', ['clean-test']);

gulp.task('pre-test', function () {
  return gulp.src(['./server/**/*.js', '!./**/__test__/**'])
    // instruments code for measuring test coverage
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    // force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['lint', 'clean-test', 'pre-test'], function () {
  return gulp.src(['./**/__test__/**/*.js', '!./build/**'], { read: false })
    // runs the unit tests
    .pipe(mocha({
      ui: 'bdd'
    }))
    // generates a coverage directory with reports for finding coverage gaps
    .pipe(istanbul.writeReports());
});

// gulp.task('index', indexer(gulpUtil));
