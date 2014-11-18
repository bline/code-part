/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # part
(function () {
  'use strict';
  module.exports = {
    shimPlugin: function (name, value) {
      var shim = {};
      shim[name] = value;
      return {
        provides: [name],
        consumes: [],
        setup: function (options, imports, register) {
          register(null, shim);
        }
      };
    }
  };
})();