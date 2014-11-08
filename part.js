
var part = require('./index.js');

var filePath = process.argv[0] || 't.js';

var fileBuffer = new Buffer(1024 * 10);
process.stdin.resume();
process.stdin.on('data', function (data) {
  fileBuffer += data;
});
process.stdin.on('end', function () {
  console.log(part(filePath, fileBuffer.toString()));
});

