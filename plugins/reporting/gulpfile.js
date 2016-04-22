require('babel/register')();

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
// var fs = require('fs');
// var path = require('path');
// var url = require('url');
// var Promise = require('bluebird');
// var request = require('request');
// var md5 = require('md5');

// function fetchBinaries(dest) {
//   var phantomDest = path.resolve(dest, '.phantom');
//   var phantomBinaries = [{
//     description: 'Windows',
//     url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-windows.zip',
//     checksum: 'c5eed3aeb356ee597a457ab5b1bea870',
//   }, {
//     description: 'Max OS X',
//     url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-macosx.zip',
//     checksum: 'fb850d56c033dd6e1142953904f62614',
//   }, {
//     description: 'Linux x86_64',
//     url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2',
//     checksum: '4ea7aa79e45fbc487a63ef4788a18ef7',
//   }, {
//     description: 'Linux x86',
//     url: 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-i686.tar.bz2',
//     checksum: '814a438ca515c6f7b1b2259d0d5bc804',
//   }];


//   var downloads = phantomBinaries.reduce(function (chain, binary) {
//     var params = url.parse(binary.url);
//     var filename = params.pathname.split('/').pop();
//     var filepath = path.join(phantomDest, filename);

//     // verify the download checksum
//     var verifyChecksum = function (file, cb) {
//       fs.readFile(file, function (err, buf) {
//         if (err) return cb(err);
//         if (binary.checksum !== md5(buf)) return cb(binary.description + ' checksum failed');
//         cb();
//       });
//     };

//     return chain.delay(4).then(function () {
//       return Promise.fromCallback(function (cb) {
//         verifyChecksum(filepath, cb);
//       })
//       .catch(function () {
//         return Promise.fromCallback(function (cb) {
//           var ws = fs.createWriteStream(filepath)
//           .on('finish', function () {
//             verifyChecksum(filepath, cb);
//           });

//           // download binary, stream to destination
//           request(binary.url)
//           .on('error', cb)
//           .pipe(ws);
//         });
//       });
//     });
//   }, Promise.resolve());

//   return downloads;
// }

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

gulp.task('test', function () {
  return gulp.src([
    'test/**/*.js',
    '!test/fixtures/**/*.js',
  ], {read: false})
  .pipe(mocha({ reporter: 'dot' }));
});

