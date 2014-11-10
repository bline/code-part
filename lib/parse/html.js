/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function (part) {
  'use strict';
  var _ = require('lodash');
  var HtmlParser = require('htmlparser2').Parser;

  function tokenizeHtml(pathName, code, options) {
    var parser, lastComment = null, tokens = [];

    function pushComment(text) {
      tokens.push({ type: 'comment', value: text.replace(/^[\t ]|[\t ]$/g, ''), src: '<!--' + text + '-->' });
    }
    function pushCode(start, end) {
      tokens.push({ type: 'code', value: code.substr(start, end - start) });
    }
    function flushCode(comment) {
      var lastEnd = lastComment ? lastComment.end + 1 : 0;
      if (comment.start !== lastEnd || !code.length)
        pushCode(lastEnd, comment.start);
    }
    function onComment(text) {
      // skip directives
      if (!options.noSkipDirectives && /^\[/.test(text)) return;
      var comment = { start: parser.startIndex, end: parser.endIndex };
      flushCode(comment);
      pushComment(text);
      lastComment = comment;
    }

    parser = new HtmlParser({ oncomment: onComment });

    parser.write(code);
    parser.end();

    flushCode({start: code.length});

    return tokens;
  }
  module.exports = tokenizeHtml;
  module.exports.accepts = ['.html', '.xml', '.rss'];
})();
