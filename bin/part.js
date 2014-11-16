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
    console.log(util.inspect(part(filePath, fileData), {depth: 100, colors: true}));
  });
})();
