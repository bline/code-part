'use strict';
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');


gulp.task("test", function () {
  gulp.src(['test/*helper.js', 'test/*spec.js'], { read: false })
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec', globals: ['expect', 'should']}))
    .pipe(plumber.stop());
});

gulp.task("watch", function () {
  gulp.watch(['test/*.js', 'index.js'], ['test']);
});

gulp.task("default", ["test"]);

