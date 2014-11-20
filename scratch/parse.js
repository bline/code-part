/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  'use strict';
  var util = require("util"),
    fs = require('fs'),
    path = require('path'),
    _ = require("lodash"),
    Generator = require('jison').Parser,
    SourceMap = require("source-map"),
    SourceMapConvert = require("convert-source-map"),
    Collect = require("./collector.js"),
    Lexer = require("lex"),
    lf = /\r?\n|\n|\f/;

  function getLineForIndex(src, index) {
    return src.substr(0, index).split(lf).length - 1;
  }

  function printLines(src, index, options) {
    options = _.extend({
      colors: true,
      plus: 3,
      minus: 3,
      debug: false
    }, (options || {}));
    var useColors = options.colors,
      plus = options.plus,
      minus = options.minus,
      colors, lineNumber, lines, startLine, endLine,
      colWidth;
    if (useColors)
      colors = require("colors");
    else
      colors = { red: _.identity, grey: _.identity }
    lines = src.split(lf);
    lineNumber = getLineForIndex(src, index);
    startLine = lineNumber - minus < 0 ? 0 : lineNumber - minus;
    endLine = lineNumber + plus + 1 >= lines.length ? lines.length - 1 : lineNumber + plus;
    colWidth = String(endLine).length + 2;
    _.forEach(lines, function (lineStr, i) {
      if (i + 1 < startLine) return;
      if (i + 1 > endLine)   return false;
      var numLen = String(i + 1).length,
        padRight = _.times(colWidth - numLen, _.noop).join(' '),
        printStr = (i + 1) + (' |' + padRight + lineStr);
      if (lineNumber === i + 1)
        console.log(colors.red('> ') + printStr);
      else
        console.log(colors.grey('  ' + printStr));
    });
  }

  function throwError(src, index, options) {
    var char = src[index];
    if (options.debug)
      printLines(src, index, options);
    throw new Error("Unexpected character " + util.inspect(char) + " at ./test.coffee:" + getLineForIndex(src, index));
  }

  var grammar = fs.readFileSync("./js-comment.jison", {encoding: "utf8"});
  var generater = new Generator(grammar);
  // XXX write this to a file
  var parserSource = generater.generate();
  fs.writeFileSync('./js-comment.js', parserSource);

  /*
  processFile(process.argv[1]);
  */
  processFile("./test.coffee");



  function processFile(filePath) {
    var src = fs.readFileSync(filePath, {encoding: "utf8"});

    var Parser = require("./js-comment.js").Parser;
    var parser = new Parser();
    parser.lexer = lexerFor(filePath);
    parser.yy.collector = new Collect();
    console.log(util.inspect(parser.parse(src), { depth: 10 } ));
  }

  function lexerFor(fileName, src) {
    var ext = path.extname(fileName) || path.basename(fileName);
    var lexer = new Lexer(function (char) {
      throwError(src, this.index);
    });
    /* plugin language file here */
    if (ext === '.coffee')
      return addCoffeeRules(lexer);
    else if (ext === '.js')
      return addJSRules(lexer);
  }

/*



%%


{multi_comment} %{

  %}


{comment}{nl} %{
    yytext = yytext
      .replace(/^\/\/\s* /, '')
      .replace(/[\r\n\f]$/, '');
    console.log("comment: " + yytext);
    return 'LINE_COMMENT';
  %}
\/(?:[^\/]|"\\/")*\/  %{
    console.log("regex");
    return 'CODE';
  %}
{string} %{
    console.log("string");
    return 'CODE';
  %}
<<EOF>> %{
    console.log("eof");
    return 'EOF';
  %}
(.|\n)  %{
    return 'CODE';
  %}

*/
  function makeToken(yytext, lexeme) {
    return { value: yytext, src: lexeme };
  }
  function codeRule(lexeme) {
    this.yytext = makeToken(lexeme);
    return 'CODE';
  };

  function formatRule(type) {
    var repl = _.toArray(arguments).slice(1).map(function (re) {
      return _.isArray(re) ? re : _.isRegExp(re) ? [re, ''] : [re];
    });
    return function (lexeme) {
      var yytext = lexeme;
      repl.forEach(function (d) {
        if (_.isFunction(d[0]))
          yytext = d[0].apply(d[0], [yytext].concat(d.slice(1)));
        else if (_.isRegExp(d[0])) {
          yytext = yytext.replace.apply(yytext, d);
        }
      });
      this.yytext = makeToken(yytext, lexeme);
      return type;
    };
  }

  function addJSRules(lexer) {

    var string        = /(?:\"(?:[^\n\r\f\\\"]|\\(?:\r\n?|\n|\f)|\\[\s\S])*\")|(?:\'(?:[^\n\r\f\\\']|\\(?:\r\n?|\n|\f)|\\[\s\S])*\')/,
        multi_comment = /\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//,
        comment       = /\/\/[^\n\r\f]*[\n|\r\n|\f]/,
        regex         = /\/(?:[^\\\/]|(?:\\(?:\\\\)*.))+\//,
        stringTest = "\\\"", // "
        regexText = /\\/, test2 = /\\\\/, test3 = /\/\/\//;

    lexer.addRule(string, codeRule);
    lexer.addRule(multi_comment, formatRule('MULTI_COMMENT', /\/$/, /^\//, /^\s*[ \t]?/mg))
    lexer.addRule(regex, codeRule);
    lexer.addRule(comment, formatRule('LINE_COMMENT', /^\/\/[ \t]?/, /[\r\n\f]$/));
    lexer.addRule(/[\s\S]/, codeRule);
    lexer.addRule(/$/, function(lexeme) { return 'EOF'; });
    return lexer;
  }
  function addCoffeeRules(lexer) {

    var string        = /\'(?:[^\\]|\\[\s\S])*\'/,
        multi_comment = /^###[\s\S]*?^[ \t]*###(\s|$)/m,
        comment       = /#[^\n\r\f]*[\n|\r\n|\f]/,
        regex         = /\/(?:[^\\\/]|(?:\\(?:\\\\)*.))+\//,
        ST_INITIAL    = 0,
        ST_ESTR       = 2, /* exclusive */
        ST_EMSTR      = 4, /* exclusive */
        ST_ECODE      = 6, /* exclusive */
        ST_MRE        = 8, /* exclusive */
        curlyDepth    = 0,
        curState,
        stack         = [];

    var codeStates = [0, ST_ECODE]


    lexer.addRule(string, codeRule, codeStates);

    /* multi-line rules to account for coffee script embedding
     * code within strings to unlimited nesting. Note single
     * quoted strings do not allow `#{}` expressions.
     * Fortunatly, [CoffeeScript] does not allow nesting of multi-line
     * expressions:
     *
     * * `///Multi\nLine\nRegExp///`
     * * `"""Multi\nLine\nString"""`
     * * `"Multi\n Line\n String\n no line breaks"`
     */
    function evalStringRules(begin, end, state) {
      var curStates = [state];
      lexer.addRule(begin, function(lexeme) {
        if (curState) stack.push(curState);
        curState = this.state = state;
        this.yytext = makeToken(lexeme);
        return 'CODE';
      }, codeStates);
      lexer.addRule(/\\(?:\\\\)*[\s\S]/, codeRule, curStates);
      lexer.addRule(end, function(lexeme) {
        this.yytext = makeToken(lexeme);
        curState = this.state = stack.pop() || ST_INITIAL;
        return 'CODE';
      }, curStates);
      lexer.addRule(/#{/, function(lexeme) {
        stack.push(curState);
        this.yytext = makeToken(lexeme);
        curState = this.state = ST_ECODE;
        return 'CODE';
      }, curStates);
      lexer.addRule(/[\s\S]/, codeRule, curStates);
    }
    evalStringRules(/"/, /"/, ST_ESTR, 'CODE');
    evalStringRules(/"""/, /"""/, ST_EMSTR, 'CODE');
    evalStringRules(/\/\/\//, /\/\/\//, ST_MRE, 'CODE');

    /* special rule to track ending #{} expressions within
     * and the coffeescript strings which allow them, see the multi line
     * rules above
     */
    lexer.addRule(/}/g, function () {
      curState = this.state = stack.pop() || ST_INITIAL;
      this.reject = true;
    }, [ST_ECODE]);

    /* Multi-line comments are simple enough to get in a simple
     * regex.
     */
    lexer.addRule(multi_comment, formatRule('MULTI_COMMENT', /^###/, /(?:\r\n?|\n|\f)###\s*$/, /^\s*# ?/mg));
    /* Match single line regular expression. */
    lexer.addRule(regex, codeRule, codeStates);
    lexer.addRule(comment, formatRule('LINE_COMMENT', /^#[ \t]?/, /[\r\n\f]$/));
    lexer.addRule(/\w+|[\s\S]/, codeRule, [/* no non-code rules have states, so run me whenever */]);

    lexer.addRule(/$/, function(lexeme) { return 'EOF'; }, [/* never know, could get it anytime */]);

    return lexer;
  }

})();
