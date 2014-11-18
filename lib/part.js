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
    fs = require('fs'),
    debug = require('debug')('code-part'),
    plugin = require('plugin');

  Part.defaults = {
    plugins: null,
    pluginPaths: null,
    extension: null
  };
  Part.defaultPlugins = [];
  Part.defaultPluginPaths = [];
  Part.corePluginPath = path.join(__dirname, 'plugin');
  Part.corePlugins = ['split.js', 'dox.js'];

  function formatPlugins(plugins) {
    return plugins.map(function (plugin) {
      if (plugin[0] === '=')
        return plugin.slice(1);
      return 'code-part-plugin-' + plugin;
    });
  }

  function Part(opt) {
    debug("Instantiating");
    Part.super_.call(this);
    if (!opt) opt = {};
    this.opt = _.extend({}, Part.defaults, opt);
    debug("Instantiated");
    return this;
  }
  util.inherits(Part, EventEmitter);

  Part.prototype.init = function () {
    try {
      this._initLoader();
    } catch (e) {
      this.emit('error', e);
    }
  };

  Part.prototype._initLoader = function () {
    debug("Initializing plugin loader");
    var plugins = formatPlugins(this.opt.plugins || Part.defaultPlugins).concat(Part.corePlugins),
      pluginPaths = (this.opt.pluginPaths || Part.defaultPluginPaths).concat([Part.corePluginPath]);

    this._loader = plugin(this);

    this._loader.paths.apply(this._loader, pluginPaths);
    this._loader.require.apply(this._loader, plugins);

    this._loader.load(function (err, plugins) {
      if (err) {
        debug("load error: " + err);
        return this.emit('error', err);
      }
      debug("Plugins loaded ", _.keys(plugins));
      this._pluginsLoaded = true;
      _.values(plugins).forEach(function (plugin) {
        var opt = this._loader.params(plugin.name) || {};
        _.merge(opt, plugin.defaultOptions || plugin.defaults || {});
        this._loader.params(plugin.name, opt);
      }.bind(this));
      this._loader.params(this.opt); }.bind(this))
    .on('error', function (error) {
      debug("plugin error: " + error);
      this.emit('error', error); }.bind(this));
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
    debug("_ensurePluginsLoaded");
    if (this._pluginsLoaded) return callback(null, this._loader.exports);
    this._loader.once('ready', callback);
  };

  Part.prototype._loadFile = function (file, plugins, callback) {
    debug("_loadFile");
    var on = outcome.error(callback);
    if (!_.isString(file.contents))
      fs.readFile(file.name, { encoding: 'utf8' }, on.success(function (data) {
        debug("loaded " + file.name);
        file.contents = data;
        callback(null, file);
      }));
    else
      callback(null, file);
  };

  Part.prototype._parseFile = function (file, callback) {
    debug("_parseFile " + file.name);
    var on = outcome.error(callback);
    this._loader.loadModules({ type: 'part', accepts: file.ext }, on.success(function (plugins) {
      debug("loaded " + plugins.length);
      async.series(plugins.map(function (plugin) {
        return function (next) { plugin.run(file, next); };
      }), on.success(function () {
        debug("end " + file.name);
        this.emit('end', null, file);
        callback(null, file);
      }.bind(this)));
    }.bind(this)));
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
    part.init();
    debug("part.parse(" + pathName + ")");
    return part.parse(pathName, code, callback);
  };
  module.exports.Part = Part;
})();
