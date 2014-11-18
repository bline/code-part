/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  'use strict';
  var tokHtml = require("./html"),
    tokLinebased = require("./linebased");
  
  module.exports = function tokenize(options, imports, register) {
    var api = {
      "tokenize": {
        "html": tokHtml(options.html, imports),
        "linebased": tokLinebased(options.linebased, imports)
      }
    };
    register(null, api);
  };
  module.exports.defaultOptions = {
    html: tokHtml.defaultOptions,
    linebased: tokLinebased.defaultOptions
  };
  module.exports.optionName = "tokenize";
})();