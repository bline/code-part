# code-part
[![GitHub version](https://badge.fury.io/gh/bline%2Fcode-part.svg)](http://badge.fury.io/gh/bline%2Fcode-part) [![Build Status](https://secure.travis-ci.org/bline/code-part.png?branch=master)](http://travis-ci.org/bline/code-part) [![Coverage Status](https://coveralls.io/repos/bline/code-part/badge.png?branch=master)](https://coveralls.io/r/bline/code-part?branch=master) [![Dependency Status](https://david-dm.org/bline/code-part.svg)](https://david-dm.org/bline/code-part) [![devDependency Status](https://david-dm.org/bline/code-part/dev-status.svg)](https://david-dm.org/bline/code-part#info=devDependencies)

Parts comments and code into a data structure with htmlParser2 for html and
docco for everything else. Also tracks starting line number for each chunk so
it's possible to add line number if you plan to use a syntax highlighter like
[google-code-prettify](https://code.google.com/p/google-code-prettify/) to
display the code.

## Usage

```javascript

  var part = require('code-part');

  // Path is used to decide which parser
  // to use for both code-part and docco.
  var sections = part(path, code, config); // config is passed to docco
                                           // not used in htmlParser2 code path

  // If code is null, path is read in as code
```

## Sections

* input:

```javascript
// comment 1
var code = 1;
// comment 2
if (code) code += 1
```

* output:

```javascript
[ { docsText: 'comment 1\n',
    codeText: 'var code = 1;\n',
    docsLine: 1,
    codeLine: 2 },
  { docsText: 'comment 2\n',
    codeText: 'if (code) code += 1\n\n',
    docsLine: 3,
    codeLine: 4 } ]
```

* input:

```html
<html>
  <!-- title part -->
  <head><title> title </title></head>
<body>
  <!-- main body -->
  <h1>hello world</h1>
<!-- the end -->
</body>
</html>
```

output:

```javascript
[ { docsText: '',
    docsLine: 1,
    codeText: '<html>\n  ',
    codeLine: 1 },
  { docsText: 'title part',
    docsLine: 2,
    codeText: '\n  <head><title> title </title></head>\n<body>\n  ',
    codeLine: 2 },
  { docsText: 'main body',
    docsLine: 5,
    codeText: '\n  <h1>hello world</h1>\n',
    codeLine: 5 },
  { docsText: 'the end',
    docsLine: 7,
    codeText: '\n</body>\n</html>\n',
    codeLine: 7 } ]
```

