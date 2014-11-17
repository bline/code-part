(function () {
  'use strict';
  var part = require('../index.js');
  var util = require('util');

  var filePath = process.argv[2] || 't.js';

  process.stdin.resume();
  var fileData = '';
  process.stdin.on('data', function (data) {
    fileData += data.toString();
  });
  process.stdin.on('end', function () {
    part(filePath, fileData)
      .on('end', function (err, file) {
        console.log(util.inspect(file.sections, {depth: 100, colors: true})); })
      .on('error', function (err) {
        console.error(err); });
  });
})();
