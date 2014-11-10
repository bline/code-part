/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  "use strict";
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
    it("should take 3 arguments", function () {
      require("../index.js").length
        .should.equal(3);
    });
    it("should throw Error with no args", function () {
      (function () { require("../index.js")(); })
        .should.throw(Error);
    });
  });
  describe("part#Interface", function () {
    beforeEach(function () {
      this.part = require("../index.js");
    });
    describe("lineBased", function () {
      it("should extract empty", function () {
        expect(this.part('t1.js', ""))
          .to.deep.equal([]);
      });
      it("should extract literate empty", function () {
        expect(this.part('t1.litcoffee', ""))
          .to.deep.equal([]);
      });
      it("should extract comment", function () {
        expect(this.part('Cakefile', "# t1"))
          .to.deep.equal([section("t1", 1, "", 1)]);
      });
      it("should extract literate comment", function () {
        expect(this.part('t1.litcoffee', "t1"))
          .to.deep.equal([section("t1", 1, "", 1)]);
      });
      it("should extract code", function () {
        expect(this.part('t1.js', "var code = 1;"))
          .to.deep.equal([section("", 1, "var code = 1;", 1)]);
      });
      it("should extract literate code", function () {
        expect(this.part('t1.litcoffee', "\tcode = 1"))
          .to.deep.equal([section("", 1, "code = 1", 1)]);
      });
      it("should extract comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode = 1;"))
          .to.deep.equal([section("t1\n", 1, "code = 1;", 2)]);
      });
      it("should extract literate comment|code", function () {
        expect(this.part('t1.litcoffee', "t1\n\n\tcode = 1"))
          .to.deep.equal([section("t1\n\n", 1, "code = 1", 3)]);
      });
      it("should extract code|comment", function () {
        expect(this.part('Cakefile', "code = 'foo';\n# t1"))
          .to.deep.equal([section("", 1, "code = 'foo';\n", 1), section("t1", 2, "", 2)]);
      });
      it("should extract literate code|comment", function () {
        expect(this.part('t1.litcoffee', "\tcode = 'foo'\n\nt1"))
          .to.deep.equal([section("", 1, "code = 'foo'\n\n", 1), section("t1", 3, "", 3)]);
      });
      it("should extract comment|comment", function () {
        expect(this.part('t1.js', "// t1\n// t2"))
          .to.deep.equal([section("t1\nt2", 1, "", 2)]);
      });
      it("should extract literate comment|comment", function () {
        expect(this.part('t1.litcoffee', "t1\nt2"))
          .to.deep.equal([section("t1\nt2", 1, "", 2)]);
      });
      it("should extract code|code", function () {
        expect(this.part('t1.js', "var foo = 1,\n\tbar = 2;"))
          .to.deep.equal([section("", 1, "var foo = 1,\n    bar = 2;", 1)]);
      });
      it("should extract literate code|code", function () {
        expect(this.part('t1.litcoffee', "\tfoo = 1,\n\tbar = 2"))
          .to.deep.equal([section("", 1, "foo = 1,\nbar = 2", 1)]);
      });
      it("should extract comment|code|comment", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2", 3, "", 3)]);
      });
      it("should extract literate comment|code|comment", function () {
        expect(this.part('t1.litcoffee', "t1\n\n    code=1\n\nt2"))
          .to.deep.equal([section("t1\n\n", 1, "code=1\n\n", 3), section("t2", 5, "", 5)]);
      });
      it("should extract comment|code|comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;", 4)]);
      });
      it("should extract literate comment|code|comment|code", function () {
        expect(this.part('t1.litcoffee', "t1\n\n\tcode=1\n\nt2\n\n\tfoo = 1"))
          .to.deep.equal([section("t1\n\n", 1, "code=1\n\n", 3), section("t2\n\n", 5, "foo = 1", 7)]);
      });
      it("should extract code|comment|code|comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;", 4)]);
      });
      it("should extract literate code|comment|code|comment|code", function () {
        expect(this.part('t1.litcoffee', "t1\n\n\tcode=1\n\nt2\n\n\tfoo = 1"))
          .to.deep.equal([section("t1\n\n", 1, "code=1\n\n", 3), section("t2\n\n", 5, "foo = 1", 7)]);
      });
      it("should end doc", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n//----\nvar foo = 1;"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("----\n", 3, "", 4), section("", 4, "var foo = 1;", 4)]);
      });
      it("should load from file", function () {
        expect(this.part('./test/t1.js'))
          .to.deep.equal([
            section("", 1, "(function () {\n  'use strict';\n", 1),
            section("comment1\n", 3, "  var code1 = 1;\n", 4),
            section("comment2\n", 5, "  var code2 = 2;\n})();\n", 6)
          ]);
      });
    });
    describe("htmlParser", function () {
      it("should extract empty", function () {
        expect(this.part('t1.html', ""))
          .to.deep.equal([section("", 1, '', 1)]);
      });
      it("should extract comment", function () {
        expect(this.part('t1.html', "<!-- t1\n -->"))
          .to.deep.equal([section("t1\n", 1, '', 2)]);
      });
      it("should extract code", function () {
        expect(this.part('t1.html', "<div></div>"))
          .to.deep.equal([section("", 1, "<div></div>", 1)]);
      });
      it("should extract comment|code", function () {
        expect(this.part('t1.html', "<!-- t1 -->\n<code a=\"1\"></code>"))
          .to.deep.equal([section("t1", 1, "\n<code a=\"1\"></code>", 2)]);
      });
      it("should extract code|comment", function () {
        expect(this.part('t1.html', "<code></code>\n<!-- foo bar baz -->"))
          .to.deep.equal([section("", 1, "<code></code>\n", 1), section("foo bar baz", 2, "", 2)]);
      });
      it("should extract comment|comment", function () {
        expect(this.part('t1.html', "<!-- t1 --><!-- t2 -->"))
          .to.deep.equal([section("t1", 1, "", 1), section("t2", 1, "", 1)]);
      });
      it("should extract code|code", function () {
        expect(this.part('t1.html', "<div>\n\t<div>foo</div>\n</div>"))
          .to.deep.equal([section("", 1, "<div>\n\t<div>foo</div>\n</div>", 1)]);
      });
      it("should extract comment|code|comment", function () {
        expect(this.part('t1.html', "<!-- t1 -->\n<!-- t2 -->"))
          .to.deep.equal([section("t1", 1, "\n", 2), section("t2", 2, "", 2)]);
      });
      it("should extract comment|code|comment|code", function () {
        expect(this.part('t1.html', "<!-- t1 --><div/>\n<!-- t2 -->\n<h2>\n"))
          .to.deep.equal([section("t1", 1, "<div/>\n", 1), section("t2", 2, "\n<h2>\n", 3)]);
      });
      it("should skip directives", function () {
        expect(this.part('t.html', "<div>\n<!--[if foo]--></div>"))
          .to.deep.equal([section("", 1, "<div>\n<!--[if foo]--></div>", 1)]);
      });
      it("should explicitly skip directives", function () {
        expect(this.part('t.html', "<div>\n<!--[if foo]--></div>", {noSkipDirectives: false}))
          .to.deep.equal([section("", 1, "<div>\n<!--[if foo]--></div>", 1)]);
      });
      it("should not skip directives", function () {
        expect(this.part('t.html', "<div>\n<!--[if foo]--></div>", {noSkipDirectives: true}))
          .to.deep.equal([section("", 1, "<div>\n", 1), section("[if foo]", 2, "</div>", 2)]);
      });
      it("should respect new extension", function () {
        expect(this.part('t1.foo', "<!-- t1 -->\n<code a=\"1\"></code>", {extension: '.html'}))
          .to.deep.equal([section("t1", 1, "\n<code a=\"1\"></code>", 2)]);
      });
    });
  });
})();
