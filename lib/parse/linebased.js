/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # parse docco
// modified from docco.parse
(function () {
  'use strict';
  var _ = require('lodash');
  var path = require('path');
  function adjustLiterate(lines, lang) {
    var isText = true, maybeCode = true, inCode, outCode, match;
    inCode = function (line, i) {
        match = /^([ ]{4}|[ ]{0,3}\t)/.exec(line);
        if (match) {
          isText = false;
          lines[i] = line.slice(match[0].length);
        } else {
          outCode(line, i);
        }
    };
    outCode = function (line, i) {
      maybeCode = /^\s*$/.test(line);
      if (maybeCode) {
        lines[i] = isText ? lang.symbol : '';
      } else {
        isText = true;
        lines[i] = lang.symbol + ' ' + line;
      }
    };
    lines.forEach(function (line, i) {
      if (maybeCode) {
        inCode(line, i);
      } else  {
        outCode(line, i);
      }
    });
    return lines;
  }
  function buildLanguageMatches(languages) {
    _.forEach(languages, function (v, k) {
      _.extend(v, {
        commentMatcher: new RegExp("^(\\s*" + v.symbol + "\\s?)"),
        commentFilter: /(^#![/]|^\s*#\{)/
      });
    });
    return languages;
  }
  var languages = buildLanguageMatches(require('../../resources/languages.json'));
  function tokenizeLines(pathName, code, options) {
    var ext = options.extension || path.extname(pathName) || path.basename(pathName),
      lang = languages[ext], lines,
      tokens = [], hasCode, codeText, docsSrc, docsText;

    if (code.length === 0)
      return [];
    lines = code
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n')
      .split(/\n/);

    if (lang.literate) {
      lines = adjustLiterate(lines, lang);
    }

    function save(force) {
      if (force || docsSrc.length)
        tokens.push({
          type:  'comment',
          src:   docsSrc,
          value: docsText
        });
      if (force || codeText.length)
        tokens.push({
          type:  'code',
          value: codeText
        });
      hasCode = false;
      codeText = docsSrc = docsText = '';
    }

    hasCode = false;
    codeText = docsSrc = docsText = '';
    lines.forEach(function (line, i) {
      if (line.match(lang.commentMatcher) && !line.match(lang.commentFilter)) {
        if (hasCode)
          save();

        docsSrc += line;
        line = line.replace(lang.commentMatcher, '');
        docsText  += line;
        if (i + 1 !== lines.length) {
          docsSrc += '\n';
          docsText += '\n';
        }
        if (/^(---+|===+)$/.test(line)) {
          save(true);
        }
      } else {
        hasCode = true;
        codeText += line;
        if (i + 1 !== lines.length)
          codeText += '\n';
      }
    });
    save();
    return tokens;
  }
  
  module.exports = tokenizeLines;
  module.exports.accepts = _.keys(languages);
})();
