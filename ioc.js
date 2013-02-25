/**
 * IoC for RequireJS Plugin
 * 
 * Version : 0.5.0
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(function() {
  "use strict";

  /**
   * Call function.
   */
  var callFunction = function(funct, ctx, args) {
    try {
      funct.call(ctx, args);
    } catch (err) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(err);
      }
      throw err;
    }
  };
  
  /**
   * Test if object is an array.
   */
  var isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  /**
   * Test if elem is in array.
   */
  var isInArray = function(elem, array) {
    for ( var i = 0, length = array.length; i < length; i++) {
      if (array[i] === elem) {
        return true;
      }
    }
    return false;
  };

  /**
   * Promise pattern.
   */
  var Promise = function(ctx) {
    this._ctx = ctx;
    this._sucesses = [];

    this.success = function(success) {
      if (typeof success === "function") {
        this._sucesses.push(success);
      }
    };

    this.notifySuccess = function(args, ms) {
      var self = this;
      if (typeof ms === "number") {
        window.setTimeout(function() {
          for ( var i = 0; i < self._sucesses.length; i++) {
            callFunction(self._sucesses[i], self._ctx, args);
          }
        }, ms);
      } else {
        for ( var i = 0; i < self._sucesses.length; i++) {
          callFunction(self._sucesses[i], self._ctx, args);
        }
      }
    };
  };

  /**
   * ioc plugin.
   */
  var ioc = {};

  /**
   * Get configuration.
   */
  ioc.getConf = function(name, req, onload, config) {
    var iocConf = config["ioc"];
    if (!iocConf) {
      onload.error("No inject configuration !");
      return null;
    }
    var objConf = iocConf[name];
    if (!objConf) {
      onload.error("No IoC configuration for " + name);
      return null;
    }
    var scope = objConf["scope"];
    if ("singleton" !== scope && "prototype" !== scope) {
      onload.error("'scope' must be singleton or prototype for " + name);
      return null;
    }
    var module = objConf["module"];
    if (!module) {
      onload.error("'module' must be defined for " + name);
    }
    return objConf;
  };

  /**
   * Load object.
   */
  ioc.load = function(name, req, onload, config) {
    var objConf = ioc.getConf(name, req, onload, config);
    if (null === objConf)
      return;

    var argsToLoad = objConf["args"];
    var injectsToLoad = objConf["inject"];
    ioc.loadDependencies(argsToLoad, name, req, onload, config).success(function(args) {
      ioc.loadDependencies(injectsToLoad, name, req, onload, config).success(function(injects) {
        ioc.createObj(args, injects, name, req, onload, config).success(function(obj) {
          ioc.finalize(obj, name, req, onload, config);
        });
      });
    });
  };

  /**
   * Load dependencies.
   */
  ioc.loadDependencies = function(depsToLoad, name, req, onload, config) {
    var promise = new Promise(this);
    var dependencies;
    if (isArray(depsToLoad)) {
      dependencies = [];
    } else {
      dependencies = {};
    }
    var nb = 0;
    var tempDeps = [];
    var tempProps = [];
    if (!!depsToLoad) {
      for ( var prop in depsToLoad) {
        var elem = depsToLoad[prop];
        if ((typeof elem === "string") && elem.match(/^\=\>/) !== null) {
          // It's a string, dependency is a AMD module
          var moduleName = elem.substring(2);
          if (!isInArray(tempDeps, moduleName)) {
            nb++;
            if (isArray(depsToLoad)) {
              dependencies.push(null);
            } else {
              dependencies[prop] = null;
            }
            tempDeps.push(moduleName);
            tempProps.push(prop);
          }
        } else {
          // Dependency is not a AMD module
          if (isArray(depsToLoad)) {
            dependencies.push(elem);
          } else {
            dependencies[prop] = elem;
          }
        }
      }
    }
    if (nb > 0) {
      // Load all dependencies
      req(tempDeps, function() {
        for ( var i = 0; i < nb; i++) {
          var prop = tempProps[i];
          var dep = arguments[i];
          dependencies[prop] = dep;
        }
        promise.notifySuccess(dependencies);
      });
    } else {
      promise.notifySuccess(dependencies, 10);
    }
    return promise;
  };

  /**
   * Create object and inject dependencies.
   */
  ioc.createObj = function(args, dependencies, name, req, onload, config) {
    var promise = new Promise(this);
    var objConf = ioc.getConf(name, req, onload, config);
    var moduleName = objConf["module"];
    req([ moduleName ], function(module) {
      var obj = new module(args);
      if (!!dependencies) {
        for ( var prop in dependencies) {
          var dep = dependencies[prop];
          obj[prop] = dep;
        }
      }
      var after = objConf["after"];
      if (!!after) {
        callFunction(obj[after], obj);
      }
      promise.notifySuccess(obj);
    });
    return promise;
  };

  /**
   * Finalize requiring.
   */
  ioc.finalize = function(obj, name, req, onload, config) {
    var objConf = ioc.getConf(name, req, onload, config);
    onload(obj);
    var scope = objConf["scope"];
    if ("prototype" === scope) {
      // Remove proto from Require cache for scope prototype
      req.undef("ioc!" + name);
    }
  };

  return ioc;
});