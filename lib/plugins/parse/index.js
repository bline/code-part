/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
(function () {
  'use strict';
  var parseDox = require("./dox"),
    parseSplit = require("./split");
  
  module.exports = function tokenize(options, imports, register) {
    var api = {
      "parse": {
        "dox": parseDox(options.dox, imports),
        "split": parseSplit(options.split, imports)
      }
    };
    register(null, api);
  };
  module.exports.defaultOptions = {
    dox: parseDox.defaultOptions,
    split: parseSplit.defaultOptions
  };
  module.exports.optionName = "parse";
})();