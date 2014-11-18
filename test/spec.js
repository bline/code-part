/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  "use strict";
  var dox = require('dox'),
    _ = require('lodash');
  function section(docs, docsLine, code, codeLine) {
    return {
      docsText: docs,
      docsLine: docsLine,
      codeText: code,
      codeLine: codeLine
    };
  }
  describe("part#exports", function () {
    it("should load without throwing errors", function () {
      (function () { require("../index.js"); })
        .should.not.throw();
    });
    it("should be a function", function () {
      require("../index.js")
        .should.be.a('function');
    });
    it("should throw Error with no args", function () {
      (function () { require("../index.js")(); })
        .should.throw(Error);
    });
  });
  describe("part#Interface", function () {
    var part = require("../index.js");
    function ptSplit(args, expects, next) {
      args = args.slice(0);
      args.push(function (err, out) {
        if (err) console.error("Error: " + err);
        if (err) return next(err);
        expect(out.sections.split).to.deep.equal(expects);
        next();
      });
      part.apply(part, args);
    }
    function ptDox(args, expects, next) {
      args = args.slice(0);
      args.push(function (err, out) {
        if (err) console.error("Error: " + err);
        if (err) return next(err);
        expect(out.sections.dox).to.deep.equal(expects);
        next();
      });
      part.apply(part, args);
    }
    describe("Part", function () {
      it("should default options", function () {
        var p = new part.Part();
        expect(p.opt).to.deep.equal(part.Part.defaults);
      });
      it("should append throw on invalid plugins", function (next) {
        var p = new part.Part({ plugins: ['foo-bar']});
        p.on('error', function (err) {
          expect(err).to.exist();
          next();
        });
      });
      it("should throw error with no filename", function () {
        var p = new part.Part();
        expect(function () {
          p.parse();
        }).to.throw();
      });
      it("should allow no src", function (next) {
        var p = new part.Part();
        p.parse("foo.js", function (err) {
          expect(err).to.exist();
          next();
        });
      });
    });
    describe("coffeeDox", function () {
      it("should have coffee in code", function (next) {
        ptDox(['t1.coffee', "code = 1\n"], [ {
          tags: [],
          description: { full: '', summary: '', body: '' },
          isPrivate: false,
          isConstructor: false,
          line: 1,
          codeStart: 0,
          code: 'code = 1\n',
          generatedCode: "(function() {\n  var code;\n\n  code = 1;\n\n}).call(this);",
          generatedCodeStart: 0,
          ctx: undefined
        } ], next);
      });
      it("should have correct codeStart", function (next) {
        ptDox(['t1.coffee', "###*\n * a comment\n###\n\ncode = 1\n"], [ {
          tags: [],
          description: { full: 'a comment', summary: 'a comment', body: '' },
          isPrivate: false,
          isConstructor: false,
          line: 2,
          codeStart: 4,
          isEvent: false,
          ignore: false,
          code: 'code = 1\n',
          generatedCode: "(function() {\n  var code;\n\n  code = 1;\n\n}).call(this);",
          generatedCodeStart: 6,
          ctx: undefined
        } ], next);
      });
    });
    describe("lineBased", function () {
      it("should extract empty", function (next) {
        ptSplit(['t1.js', ''], [], next);
      });
      it("should extract literate empty", function (next) {
        ptSplit(['t1.litcoffee', ""], [], next);
      });
      it("should extract comment", function (next) {
        ptSplit(['Cakefile', "# t1"], [section("t1", 1, "", 1)], next);
      });
      it("should extract literate comment", function (next) {
        ptSplit(['t1.litcoffee', "t1"], [section("t1", 1, "", 1)], next);
      });
      it("should extract code", function (next) {
        ptSplit(['t1.js', "var code = 1;"], [section("", 1, "var code = 1;", 1)], next);
      });
      it("should extract literate code", function (next) {
        ptSplit(['t1.litcoffee', "\tcode = 1"], [section("", 1, "code = 1", 1)], next);
      });
      it("should extract comment|code", function (next) {
        ptSplit(['t1.js', "// t1\ncode = 1;"], [section("t1\n", 1, "code = 1;", 2)], next);
      });
      it("should extract literate comment|code", function (next) {
        ptSplit(['t1.litcoffee', "t1\n\n\tcode = 1"], [section("t1\n\n", 1, "code = 1", 3)], next);
      });
      it("should extract code|comment", function (next) {
        ptSplit(['Cakefile', "code = 'foo';\n# t1"], [section("", 1, "code = 'foo';\n", 1), section("t1", 2, "", 2)], next);
      });
      it("should extract literate code|comment", function (next) {
        ptSplit(['t1.litcoffee', "\tcode = 'foo'\n\nt1"], [section("", 1, "code = 'foo'\n\n", 1), section("t1", 3, "", 3)], next);
      });
      it("should extract comment|comment", function (next) {
        ptSplit(['t1.js', "// t1\n// t2"], [section("t1\nt2", 1, "", 2)], next);
      });
      it("should extract literate comment|comment", function (next) {
        ptSplit(['t1.litcoffee', "t1\nt2"], [section("t1\nt2", 1, "", 2)], next);
      });
      it("should extract code|code", function (next) {
        ptSplit(['t1.js', "var foo = 1,\n\tbar = 2;"], [section("", 1, "var foo = 1,\n    bar = 2;", 1)], next);
      });
      it("should extract literate code|code", function (next) {
        ptSplit(['t1.litcoffee', "\tfoo = 1\n\tbar = 2\n"], [section("", 1, "foo = 1\nbar = 2\n", 1)], next);
      });
      it("should extract comment|code|comment", function (next) {
        ptSplit(['t1.js', "// t1\ncode=1;\n// t2"], [section("t1\n", 1, "code=1;\n", 2), section("t2", 3, "", 3)], next);
      });
      it("should extract literate comment|code|comment", function (next) {
        ptSplit(['t1.litcoffee', "t1\n\n    code=1\n\nt2"], [section("t1\n\n", 1, "code=1\n\n", 3), section("t2", 5, "", 5)], next);
      });
      it("should extract comment|code|comment|code", function (next) {
        ptSplit(['t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"], [section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;", 4)], next);
      });
      it("should extract literate comment|code|comment|code", function (next) {
        ptSplit(['t1.litcoffee', "t1\n\n\tcode=1\n\nt2\n\n\tfoo = 1"], [section("t1\n\n", 1, "code=1\n\n", 3), section("t2\n\n", 5, "foo = 1", 7)], next);
      });
      it("should extract code|comment|code|comment|code", function (next) {
        ptSplit(['t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"], [section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;", 4)], next);
      });
      it("should extract literate code|comment|code|comment|code", function (next) {
        ptSplit(['t1.litcoffee', "t1\n\n\tcode=1\n\nt2\n\n\tfoo = 1"], [section("t1\n\n", 1, "code=1\n\n", 3), section("t2\n\n", 5, "foo = 1", 7)], next);
      });
      it("should end doc", function (next) {
        ptSplit(['t1.js', "// t1\ncode=1;\n//----\nvar foo = 1;"],
           [section("t1\n", 1, "code=1;\n", 2), section("----\n", 3, "", 4), section("", 4, "var foo = 1;", 4)], next);
      });
      it("should load from file", function (next) {
        ptSplit(['./test/t1.js'], [
            section("", 1, "(function () {\n  'use strict';\n", 1),
            section("comment1\n", 3, "  var code1 = 1;\n", 4),
            section("comment2\n", 5, "  var code2 = 2;\n})();\n", 6)
          ], next);
      });
    });
    describe("htmlParser", function () {
      it("should extract empty", function (next) {
        ptSplit(['t1.html', ""], [section("", 1, '', 1)], next);
      });
      it("should extract comment", function (next) {
        ptSplit(['t1.html', "<!-- t1\n -->"], [section("t1\n", 1, '', 2)], next);
      });
      it("should extract code", function (next) {
        ptSplit(['t1.html', "<div></div>"], [section("", 1, "<div></div>", 1)], next);
      });
      it("should extract comment|code", function (next) {
        ptSplit(['t1.html', "<!-- t1 -->\n<code a=\"1\"></code>"], [section("t1", 1, "\n<code a=\"1\"></code>", 2)], next);
      });
      it("should extract code|comment", function (next) {
        ptSplit(['t1.html', "<code></code>\n<!-- foo bar baz -->"],
           [section("", 1, "<code></code>\n", 1), section("foo bar baz", 2, "", 2)], next);
      });
      it("should extract comment|comment", function (next) {
        ptSplit(['t1.html', "<!-- t1 --><!-- t2 -->"],
           [section("t1", 1, "", 1), section("t2", 1, "", 1)], next);
      });
      it("should extract code|code", function (next) {
        ptSplit(['t1.html', "<div>\n\t<div>foo</div>\n</div>"],
           [section("", 1, "<div>\n\t<div>foo</div>\n</div>", 1)], next);
      });
      it("should extract comment|code|comment", function (next) {
        ptSplit(['t1.html', "<!-- t1 -->\n<!-- t2 -->"],
           [section("t1", 1, "\n", 2), section("t2", 2, "", 2)], next);
      });
      it("should extract comment|code|comment|code", function (next) {
        ptSplit(['t1.html', "<!-- t1 --><div/>\n<!-- t2 -->\n<h2>\n"],
           [section("t1", 1, "<div/>\n", 1), section("t2", 2, "\n<h2>\n", 3)], next);
      });
      it("should skip directives", function (next) {
        ptSplit(['t.html', "<div>\n<!--[if foo]--></div>"],
           [section("", 1, "<div>\n<!--[if foo]--></div>", 1)], next);
      });
      it("should explicitly skip directives", function (next) {
        ptSplit(['t.html', "<div>\n<!--[if foo]--></div>", {tokenize: { html: {noSkipDirectives: false }}}],
           [section("", 1, "<div>\n<!--[if foo]--></div>", 1)], next);
      });
      it("should skip bang", function (next) {
        ptSplit(['t.html', "<div>\n<!--! foo --></div>"],
           [section("", 1, "<div>\n<!--! foo --></div>", 1)], next);
      });
      it("should not skip bang", function (next) {
        ptSplit(['t.html', "<div>\n<!--! foo --></div>", {tokenize: { html: {noSkipBang: true} } }],
           [section("", 1, "<div>\n", 1), section("! foo", 2, "</div>", 2)], next);
      });
      it("should not skip directives", function (next) {
        ptSplit(['t.html', "<div>\n<!--[if foo]--></div>", {tokenize: { html: {noSkipDirectives: true} } }],
           [section("", 1, "<div>\n", 1), section("[if foo]", 2, "</div>", 2)], next);
      });
      it("should respect new extension", function (next) {
        ptSplit(['t1.foo', "<!-- t1 -->\n<code a=\"1\"></code>", {extension: '.html'}],
           [section("t1", 1, "\n<code a=\"1\"></code>", 2)], next);
      });
    });
  });
})();
