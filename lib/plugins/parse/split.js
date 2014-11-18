/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # plugin/split.js
(function () {
  'use strict';
  var debug = require('debug')('code-part:split'),
    path = require('path'),
    _ = require('lodash'),
    architect = require("architect");

  function countLines(str) {
    return str.split("\n").length - 1;
  }

  function Formatter() {
    this.name = 'split';
    this.list = [];
    this.currentLine = 1;
    this.currentSection = null;
  }

  Formatter.prototype.getSections = function () {
    return this.list.slice(0);
  };

  Formatter.prototype.addToLines = function (count) {
    this.currentLine += count;
  };

  Formatter.prototype.addTokens = function (tokens) {
    tokens.forEach(function (token) {
      this.addToken(token);
    }.bind(this));
    return this;
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
      if (token.value.match(/^\n/)) this.attrs.codeLine++;
      this.codeSet = true;
      if (!this.docsSet)
        this.attrs.docsLine = this.parent.currentLine;
      this.parent.addToLines(countLines(token.src || token.value));
    } else {
      this.attrs.docsText = token.value;
      this.attrs.docsLine = this.parent.currentLine;
      this.docsSet = true;
      this.parent.addToLines(countLines(token.src || token.value));
      this.attrs.codeLine = this.parent.currentLine;
    }
    return this;
  };
  module.exports = function (options, imports) {
    var tokenize = imports.tokenize,
      languages = imports.languages;
    var parser = function split(file, callback) {
      _.forEach(tokenize, function (tokenizer) {
        if (languages[tokenizer.name][file.ext]) {
          tokenizer(file, function (err, tokens) {
            if (err) return callback(err);
            callback(null, (new Formatter()).addTokens(tokens).getSections());
          });
          return false;
        }
      });
    };
    parser.accepts = _.flatten(_.values(languages).map(_.keys));
    parser.name = "split";
    return parser;
  };
  module.exports.defaultOptions = {};
})();
