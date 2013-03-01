/**
 * IoC for RequireJS Plugin
 * 
 * Version : 0.6.0
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(function() {
  "use strict";
  
  /*
   * Compact promise pattern implementation (https://github.com/mathieumast/promise)
   */ 
  var Promise = function() {

    var Class = function() {
    };

    var addCallback = function(promise, type, callback) {
      if (typeof callback === "function") {
        promise.callbacks[type].push(callback);
      }
    };

    var notify = function(promise, type, objs) {
      if (promise.step === "progress") {
        promise.step = type;
        window.setTimeout(function() {
          for ( var i = 0; i < promise.callbacks[type].length; i++) {
            var callback = promise.callbacks[type][i];
            callback.apply(promise, objs);
          }
        }, 1);
      }
    };

    var join = function(promise, promises) {
      var results = [], remaining = promises.length;
      for ( var i = 0; i < promises.length; i++) {
        promises[i].index = i;
        promises[i].then(function(objs) {
          results[this.index] = objs;
          if (--remaining === 0) {
            var joinObjs = [];
            for ( var j = 0; j < results.length; j++) {
              joinObjs.push(results[j]);
            }
            notify(promise, "done", joinObjs);
          }
          promise.notifyProgress(objs);
        }, function(objs) {
          promise.notifyFail(objs);
        }, function(objs) {
          promise.notifyProgress(objs);
        });
      }
    };

    Class.prototype = {

      initialize : function() {
        this.callbacks = {
          done : [],
          fail : [],
          progress : []
        };
        this.step = "progress";
        var promises = Array.prototype.slice.call(arguments);
        if (promises.length > 0) {
          join(this, promises);
        }
      },

      notifyDone : function() {
        notify(this, "done", Array.prototype.slice.call(arguments));
      },

      notifyFail : function() {
        notify(this, "fail", Array.prototype.slice.call(arguments));
      },

      notifyProgress : function() {
        notify(this, "progress", Array.prototype.slice.call(arguments));
      },

      then : function(done, fail, progress) {
        this.done(done);
        this.fail(fail);
        this.progress(progress);
      },

      done : function(callback) {
        addCallback(this, "done", callback);
      },

      fail : function(callback) {
        addCallback(this, "fail", callback);
      },

      progress : function(callback) {
        addCallback(this, "progress", callback);
      }
    };

    var obj = new Class();
    Class.prototype.initialize.apply(obj, arguments);
    return obj;
  };

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
    return toString.call(obj) == "[object Array]";
  };

  /**
   * Test if elem is in array.
   */
  var isInArray = function(elem, array) {
    var len = array.length;
    for ( var i = 0; i < len; i++) {
      if (array[i] === elem) {
        return true;
      }
    }
    return false;
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

    var error = function() {
      onload.error("Internal error");
    };

    var res1 = ioc.loadDependencies(argsToLoad, name, req, onload, config);
    var res2 = ioc.loadDependencies(injectsToLoad, name, req, onload, config);

    var join = new Promise(res1, res2);
    join.then(function(args, injects) {
      ioc.createObj(args, injects, name, req, onload, config).then(function(obj) {
        ioc.finalize(obj, name, req, onload, config);
      }, error);
    }, error);

  };

  /**
   * Load dependencies.
   */
  ioc.loadDependencies = function(depsToLoad, name, req, onload, config) {
    var promise = new Promise();
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
        promise.notifyDone(dependencies);
      });
    } else {
      promise.notifyDone(dependencies);
    }
    return promise;
  };

  /**
   * Create object and inject dependencies.
   */
  ioc.createObj = function(args, dependencies, name, req, onload, config) {
    var promise = new Promise();
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
      promise.notifyDone(obj);
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