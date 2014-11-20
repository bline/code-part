/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  var _ = require("lodash"),
    ST_CODE = 1,
    ST_COMMENT = 2;
  function Collector(source) {
    this
      .setSource(source)
      .reset();
  }
  Collector.prototype.setSource = function (source) {
    this.source = source;
    return this;
  };
  Collector.prototype.reset = function () {
    this.collection = [];
    this.currentLine = 1;
    this.collectors = {
      code: {value: '', src: '', line: 0},
      comment: {value: '', src: '', line: 0}
    };
    this.state = ST_CODE;
    return this;
  };
  Collector.prototype.add = function (type, token) {
    console.log(type + " -> ", token);
    if (typeof token === 'string') {
      token = {value: token};
      if (typeof arguments[2] === 'string')
        token.src = arguments[2];
    }
    console.log("here", type);
    token = _.clone(token);
    if (!_.isString(token.src))
      token.src = token.value;
    console.log("resolve ", token)
    this.resolveContext(type);
    this.collectors[type].value += token.value;
    this.collectors[type].src += token.src;
    console.log("collectors: ", this.collectors);
    delete token.value;
    delete token.src;
    _.extend(this.collectors[type], token);
    return this;
  };
  Collector.prototype.typeState = function (type) {
    return type === 'code' ? ST_CODE : ST_COMMENT;
  };
  Collector.prototype.stateType = function (state) {
    if (!state) state = this.state;
    return state === ST_CODE ? 'code' : 'comment';
  };
  Collector.prototype.needsContextSwitch = function (type) {
    return this.typeState(type) !== this.state;
  };
  Collector.prototype.resolveContext = function (type) {
    if (this.needsContextSwitch(type))
      this.switchContext(type);
    return this;
  };
  Collector.prototype.flushContext = function (type) {
    var ctx = this.collectors[type],
      lines = ctx.src.split('\n').length - 1;
    delete ctx.src;
    console.log("push ", _.extend({type: type, lines: lines}, ctx))
    this.collection.push(_.extend({type: type, lines: lines}, ctx));
    this.collectors[type] = {value: '', src: ''};
    return this;
  };
  Collector.prototype.switchContext = function (type) {
    this.state = this.typeState(type);
    console.log("switch context for " + type, this.collectors[type]);
    if (this.collectors[type].src.length > 0)
      this.flushContext(type);
    else console.log("not switching for " + type, this.collectors[type])
    return this;
  };
  Collector.prototype.addCode = function (values) {
    return this.add('code', values);
  };

  Collector.prototype.addComment = function (values, multi) {
    console.log("commit -> ", values);
    return this.add('comment', _.extend({isMulti: !!multi}, values));
  };
  
  Collector.prototype.calculateLines = function () {
    var curOff = 0, curLine = 1;
    this.collection.forEach(function (token, i) {
      token.startLine = curLine;
      curLine += token.lines;
      console.log(token.type + " -> ", token);
    });
    return this;
  };

  Collector.prototype.final = function () {
    var collection = this.collection;
    this.flushContext(this.stateType());
    this.calculateLines().reset().setSource(null);
    return collection;
  };
  module.exports = Collector;
})();