(function () {
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
      (function () { require("../index.js") })
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
      (function () { require("../index.js")() })
        .should.throw(Error);
    });
  });
  describe("part#Interface", function () {
    beforeEach(function () {
      this.part = require("../index.js");
    });
    // XXX docco adds a new line to the end of the
    // last section.
    describe("docco", function () {
      it("should extract empty", function () {
        expect(this.part('t1.js', ""))
          .to.deep.equal([section("", 1, "\n", 1)]);
      });
      it("should extract comment", function () {
        expect(this.part('t1.js', "// t1"))
          .to.deep.equal([section("t1\n", 1, "", 2)]);
      });
      it("should extract code", function () {
        expect(this.part('t1.js', "var code = 1;"))
          .to.deep.equal([section("", 1, "var code = 1;\n", 1)]);
      });
      it("should extract comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode = 1;"))
          .to.deep.equal([section("t1\n", 1, "code = 1;\n", 2)]);
      });
      it("should extract code|comment", function () {
        expect(this.part('t1.js', "var code = 'foo';\n// t1"))
          .to.deep.equal([section("", 1, "var code = 'foo';\n", 1), section("t1\n", 2, "", 3)]);
      });
      it("should extract comment|comment", function () {
        expect(this.part('t1.js', "// t1\n// t2"))
          .to.deep.equal([section("t1\nt2\n", 1, "", 3)]);
      });
      it("should extract code|code", function () {
        expect(this.part('t1.js', "var foo = 1,\n\tbar = 2;"))
          .to.deep.equal([section("", 1, "var foo = 1,\n\tbar = 2;\n", 1)]);
      });
      it("should extract comment|code|comment", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "", 4)]);
      });
      it("should extract comment|code|comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;\n", 4)]);
      });
      it("should extract code|comment|code|comment|code", function () {
        expect(this.part('t1.js', "// t1\ncode=1;\n// t2\nvar foo = 1;"))
          .to.deep.equal([section("t1\n", 1, "code=1;\n", 2), section("t2\n", 3, "var foo = 1;\n", 4)]);
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
          .to.deep.equal([section("t1", 1, "\n<code a=\"1\"></code>", 1)]);
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
          .to.deep.equal([section("t1", 1, "\n", 1), section("t2", 2, "", 2)]);
      });
      it("should extract comment|code|comment|code", function () {
        expect(this.part('t1.html', "<!-- t1 --><div/>\n<!-- t2 -->\n<h2>\n"))
          .to.deep.equal([section("t1", 1, "<div/>\n", 1), section("t2", 2, "\n<h2>\n", 2)]);
      });
    });
  });
}).call(this);
