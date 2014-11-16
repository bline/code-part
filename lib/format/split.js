/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # Formatter
(function () {
  'use strict';
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
  Formatter.prototype.accepts = function (ext) {
    return true;
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
  module.exports = Formatter;
})();
