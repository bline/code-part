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
  var dox = require('dox'),
    _ = require('lodash'),
    coffee = require('coffee-script'),
    debug = require('debug')('code-part:dox');

  module.exports.name = 'dox';
  module.exports.type = 'part';
  module.exports.plugin = function (part, loader) {
    debug("plugin");
    return {
      name: 'dox',
      defaultOptions: { raw: true },
      run: function (file, next) {
        debug("run " + file.name);
        var src = file.contents.replace(/\r|\n/g, '\n'),
          opt = loader.params('dox'), srcLines,
          coffeeFile, coffeeLines;
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
              if (map && map[0])
                break;
              line++;
            }
            return map && map[0] ? map[0] : 0;
        }
        file.sections.dox = dox.parseComments(src, opt);
        // Attempts to fix line numbers and code for coffee script files
        if (coffeeLines) {
          file.sections.dox.forEach(function (section) {
            if (section.codeStart) {
              var start = getSourceLine(section.codeStart),
                end = getSourceLine(section.codeStart + (section.code || '').split('\n').length - 1) || (coffeeLines.length - 1);
              section.generatedCode = section.code;
              section.generatedCodeStart = section.codeStart;
              section.codeStart = start;
              section.code = coffeeLines.slice(start, end + 1).join("\n");
            }
          });
        }
        next(null, file);
      }
    };
  };
  module.exports.accepts = ['.js', '.coffee'];
})();

