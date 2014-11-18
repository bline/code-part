/*
 * Copyright (C) 2014 Scott Beck, all rights reserved
 *
 * Licensed under the MIT license
 *
 */
// # part
(function () {
  'use strict';
  var _ = require('lodash'),
    path = require('path'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter,
    outcome = require('outcome'),
    util = require('util'),
    debug = require('debug')('code-part'),
    architect = require('architect');

  Part.defaults = {
    configPath: __dirname,
    fs: require('fs'),
    plugins: null,
    extension: null
  };
  Part.defaultPlugins = [];
  Part.corePlugins = [
    './plugins/tokenize',
    './plugins/parse'
  ];

  function Part(opt) {
    debug("Instantiating");
    Part.super_.call(this);
    if (!opt) opt = {};
    this.opt = _.extend({}, Part.defaults, opt);
    this.util = require('./util');
    debug("Instantiated");
    process.nextTick(this.init.bind(this));
    return this;
  }
  util.inherits(Part, EventEmitter);

  Part.prototype.resolvePlugin = function (plugin, next) {
    var on = outcome.error(next);
    if (plugin.setup.defaultOptions) {
      _.merge(plugin, plugin.setup.defaultOptions);
    }
    if (plugin.setup.optionName)
      _.merge(plugin, this.opt[plugin.setup.optionName] || {});
    if (plugin.setup.plugins) {
      architect.resolveConfig(plugin.setup.plugins, plugin.packagePath, on.success(function (config) {
        this.resolveConfig(config, next);
      }.bind(this)));
    } else
      next();
  };

  Part.prototype.resolveConfig = function (config, next) {
    var on = outcome.error(next);
    async.each(config, this.resolvePlugin.bind(this), on.success(function () {
      next(null, config);
    }));
  };

  Part.prototype.init = function () {
    debug("Initializing plugin loader");
    var plugins = (this.opt.plugins || Part.defaultPlugins).concat(Part.corePlugins),
      that = this,
      on = outcome.error(function (err) {
        if (err)
          that.emit('error', err);
      });

    plugins.unshift(this.util.shimPlugin('languages', require('../resources/languages.json')));

    architect.resolveConfig(plugins, that.opt.configPath, on.success(function (config) {
      that.resolveConfig(config, on.success(function (config) {
        try {
          that.loader = new architect.Architect(config);
        } catch (e) {
          return on(e);
        }
        that.loader.on('error', on);
        that.loader.once('ready', function () {
          debug("plugins ready");
          that._pluginsLoaded = true;
        });
      }));
    }));
    return this;
  };

  Part.prototype.parse = function (fileName, src, callback) {
    debug("parse");
    if (!fileName)
      throw new Error("no file name for Part.parse");
    if (_.isFunction(src)) {
      callback = src;
      src = null;
    }
    if (!callback)
      callback = function (err) {
        if (err)
          this.emit('error', err);
      }.bind(this);

    var file = {
      sections: {},
      name: fileName,
      contents: src,
      ext: this.opt.extension || path.extname(fileName) || path.basename(fileName)
    };

    async.waterfall([
      this._ensurePluginsLoaded.bind(this),
      this._loadFile.bind(this, file),
      this._parseFile.bind(this)
    ], callback);
    return this;
  };

  Part.prototype._ensurePluginsLoaded = function (callback) {
    debug("_ensurePluginsLoaded " + this._pluginsLoaded);
    if (this._pluginsLoaded) return callback(null, this.loader);
    this.loader.once('ready', callback);
  };

  Part.prototype._loadFile = function (file, loader, callback) {
    debug("_loadFile");
    var on = outcome.error(callback);
    if (!_.isString(file.contents))
      this.opt.fs.readFile(file.name, { encoding: 'utf8' }, on.success(function (data) {
        debug("loaded " + file.name);
        file.contents = data;
        callback(null, file);
      }));
    else
      callback(null, file);
  };

  Part.prototype._parseFile = function (file, callback) {
    debug("_parseFile " + file.name);
    var on = outcome.error(callback),
      parsers = _(this.loader.getService('parse')).values().filter(function (parser) {
          return parser && parser.accepts && parser.accepts.indexOf(file.ext) !== -1;})
        .map(function (parser) {
          return function (next) {
            debug("parse " + file.name);
            parser(file, on.success(function (sections) {
              debug("done " + file.name);
              file.sections[parser.name] = sections;
              next();
            }));
          };
        }).value();
    async.parallel(parsers, on.success(function () {
      callback(null, file);
    }));
  };

  module.exports = function (pathName) {
    debug("part(" + pathName + ")");
    if (!pathName) throw new Error("path not specified to code-comb");
    var args = _.toArray(arguments).slice(1),
      code, options = {}, callback;
    args.forEach(function (arg) {
      if (_.isString(arg))
        code = arg;
      else if (_.isFunction(arg))
        callback = arg;
      else
        _.extend(options, arg);
    });
    var part = new Part(options);
    debug("part.parse(" + pathName + ")");
    return part.parse(pathName, code, callback);
  };
  module.exports.Part = Part;
})();
