(function () {
  'use strict';
  var _ = require('lodash');
  var path = require('path');
  var docco = require('docco');
  var HtmlParser = require('htmlparser2').Parser;

  var defaultOptions = {
    htmlParserExt: ['.html', '.xml']
  };

  function countLines(str) {
    return str.split("\n").length - 1;
  }

  function tokenizeHtml(code) {
    var parser, lastComment = null, tokens = [];

    function pushComment(text) {
      tokens.push({ type: 'comment', value: text.replace(/^[\t ]|[\t ]$/g, '') });
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

  function Formatter() {
    this.list = [];
    this.currentLine = 1;
    this.currentSection = null;
  }

  Formatter.prototype.addToLines = function (count) {
    this.currentLine += count;
  };

  Formatter.prototype.addToken = function (token) {
    var needsSection =
      // First time here
      !this.currentSection ||
      // Code set means no more tokens,
      // comments come before Code.    
      this.currentSection.codeSet ||
      // Comments are set once.
      token.type === 'comment' &&
      this.currentSection.docsSet;

    if (needsSection)
      this.currentSection = new Section(this);

    this.currentSection.add(token);
    return this;
  };

  function Section(parent) {
    this.parent = parent;
    this.attrs = {
      docsText: '',
      docsLine: 1,
      codeText: '',
      codeLine: 1
    };
    this.docsSet = false;
    this.codeSet = false;
    this.parent.list.push(this.attrs);
  }

  Section.prototype.add = function (token) {
    if (token.type === 'code') {
      this.attrs.codeText = token.value;
      this.attrs.codeLine = this.parent.currentLine;
      this.codeSet = true;
      this.parent.addToLines(countLines(token.value));
    } else {
      this.attrs.docsText = token.value;
      this.attrs.docsLine = this.parent.currentLine;
      this.docsSet = true;
      this.parent.addToLines(countLines(token.value));
      this.attrs.codeLine = this.parent.currentLine;
    }
    return this;
  };

  function partWithDocco(pathName, code, options) {
    if (!options.languages) options.languages = {};
    var sections = docco.parse(pathName, code, options);
    var startLine = 1;
    _.forEach(sections, function (section) {
      section.docsLine = startLine;
      startLine += countLines(section.docsText);
      section.codeLine = startLine;
      startLine += countLines(section.codeText);
    });
    return sections;
  }

  function partWithHtmlParser(pathName, code, options) {
    var tokens = tokenizeHtml(code, options);
    var formatter = new Formatter();
    _.forEach(tokens, function (token) {
      formatter.addToken(token);
    });
    return formatter.list;
  }

  function part(pathName, code, options) {
    var ext = options.extname || path.extname(pathName);
    if (options.htmlParserExt.indexOf(ext.toLowerCase()) != -1)
      return partWithHtmlParser(pathName, code, options);
    else
      return partWithDocco(pathName, code, options);
  }

  module.exports = function (pathName, source, options) {
    if (!pathName) throw new Error("path not specified to code-comb");
    if (!options) options = {};
    _.defaults(options, defaultOptions);

    if (typeof source !== 'string')
      source = require('fs').readFileSync(pathName, {encoding: 'utf8'});

    return part(pathName, source, options);
  };
})();
