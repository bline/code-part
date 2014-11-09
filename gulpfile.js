(function () {
  'use strict';
  var gulp = require('gulp');
  var $ = require('gulp-load-plugins')();
  var opn = require('opn');
  var del = require('del');

  var lintSrc = ['./gulpfile.js', './index.js', 'test/**/*.js', 'bin/*.js'];
  var testSrc = ['test/*helper.js', 'test/*spec.js'];

  function runCoverage (opts) {
    return gulp.src(testSrc, { read: false })
      .pipe($.coverage.instrument({
        pattern: ['./index.js'],
        debugDirectory: 'debug'}))
      .pipe($.plumber())
      .pipe($.mocha({reporter: 'dot'})
            .on('error', function () { this.emit('end'); })) // test errors dropped
      .pipe($.plumber.stop())
      .pipe($.coverage.gather())
      .pipe($.coverage.format(opts));
  }

  gulp.task("clean", function (done) {
    del(["coverage.html", "debug/**/*", "debug"], done);
  });

  gulp.task("lint", function () {
    return gulp.src(lintSrc)
      .pipe($.jshint())
      .pipe($.jshint.reporter(require('jshint-table-reporter')));
  });

  gulp.task('coveralls', ['clean'], function () {
    return runCoverage({reporter: 'lcov'})
      .pipe($.coveralls());
  });

  gulp.task('coverage', ['clean'], function () {
    return runCoverage({outFile: './coverage.html'})
      .pipe(gulp.dest('./'))
      .on('end', function () {
        opn('./coverage.html');
      });
  });

  gulp.task("test", ['clean', 'lint'], function () {
    return gulp.src(testSrc, { read: false })
      .pipe($.plumber())
      .pipe($.mocha({reporter: 'spec', globals: ['expect', 'should']})
           .on('error', function () { this.emit('end'); }))
      .pipe($.plumber.stop());
  });

  gulp.task("watch", function () {
    gulp.watch(lintSrc, ['test']);
  });

  gulp.task("default", ["test"]);
})();
