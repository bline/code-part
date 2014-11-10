/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # part
(function () {
  'use strict';
  var _ = require('lodash');
  var path = require('path');

  var defaultOptions = {
    noSkipDirectives: false,
    parsers: [
      require('./parse/html'),
      require('./parse/linebased')
    ],
    formatters: [
      require('./formatter')
    ]
  };

  function part(pathName, code, options) {
    var tokens = [], formats = [], ext;

    if (!pathName) throw new Error("path not specified to code-comb");
    if (!options) options = {};
    _.defaults(options, defaultOptions);

    if (!_.isString(code))
      code = require('fs').readFileSync(pathName, {encoding: 'utf8'});

    ext = options.extension || path.extname(pathName) || path.basename(pathName);

    _.forEach(options.parsers, function (parser) {
      if (parser.accepts.indexOf(ext) !== -1) {
        tokens = parser(pathName, code, options);
        return false;
      }
    });

    options.formatters.forEach(function (Formatter) {
      var formatter = new Formatter();
      formats.push(formatter.addTokens(tokens).getSections());
    });

    if (formats.length == 1)
      formats = formats[0];
    return formats;
  }

  module.exports = part;
})();
