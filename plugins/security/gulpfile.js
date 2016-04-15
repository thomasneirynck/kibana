require('babel-register')();

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');

gulp.task('lint', function () {
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
