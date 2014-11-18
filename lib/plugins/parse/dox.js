/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # dox
// format data using dox

(function () {
  'use strict';
  var Dox = require('dox'),
    _ = require('lodash'),
    coffee = require('coffee-script'),
    debug = require('debug')('code-part:dox');

  module.exports = function (opt, imports) {
    var parser = function dox(file, next) {
      debug("run " + file.name);
      var src = file.contents.replace(/\r|\n/g, '\n'),
        srcLines, coffeeFile, coffeeLines, sections;
      debug("here");
      if (file.ext !== '.js') {
        coffeeLines = src.split('\n');
        coffeeFile = coffee.compile(src, {
          filename:    file.name,
          sourceMap:   true,
          literate:    coffee.helpers.isLiterate(file.name)
        });
        src = coffeeFile.js;
        srcLines = src.split('\n');

      }
      function getSourceLine(startLine) {
          var line = startLine, map, lineStr, c, index;
          while (line < srcLines.length - 1) {
            lineStr = srcLines[line];
            c = /\w/.exec(lineStr);
            index = c ? c.index : 0;
            map = coffeeFile.sourceMap.sourceLocation([line, index]);
            if (map && map[0] && coffeeLines[map[0]] !== '')
              break;
            line++;
          }
          return map && map[0] ? map[0] : 0;
      }
      debug("calling dox with opt: " , opt + " src: ", src);
      try {
        sections = Dox.parseComments(src, opt);
      } catch (e) {
        debug("dox error ", e);
        return next(e);
      }
      debug("dox done");
      // Attempts to fix line numbers and code for coffee script files
      if (coffeeLines) {
        sections.forEach(function (section) {
          var codeStart = section.codeStart || 0,
            start = getSourceLine(codeStart),
            end = getSourceLine(codeStart + (section.code || '').split('\n').length - 1) || (coffeeLines.length - 1);
          section.generatedCode = section.code;
          section.generatedCodeStart = codeStart;
          section.codeStart = start;
          section.code = coffeeLines.slice(start, end + 1).join("\n");
        });
      }
      debug("calling next");
      next(null, sections);
    };
    parser.accepts = ['.js', '.coffee', '.litcoffee'];
    return parser;
  };
  module.exports.defaultOptions = { raw: true };
})();

