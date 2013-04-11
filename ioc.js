/**
 * IoC for RequireJS Plugin (https://github.com/mathieumast/ioc)
 * 
 * Version : 0.6.3
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(function() {
  "use strict";

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

    Promise.when(res1, res2).then(function(args, injects) {
      ioc.createObj(args, injects, name, req, onload, config).then(function(obj) {
        ioc.finalize(obj, name, req, onload, config);
      }, error);
    }, error);
  };

  /**
   * Load dependencies.
   */
  ioc.loadDependencies = function(depsToLoad, name, req, onload, config) {
    var future = Promise.future();
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
        future.notifyDone(dependencies);
      });
    } else {
      future.notifyDone(dependencies);
    }
    return future.promise();
  };

  /**
   * Create object and inject dependencies.
   */
  ioc.createObj = function(args, dependencies, name, req, onload, config) {
    var future = Promise.future();
    var objConf = ioc.getConf(name, req, onload, config);
    var moduleName = objConf["module"];
    req([ moduleName ], function(module) {
      var obj;
      if (isArray(args)) {
        switch (args.length) {
        case 0:
          obj = new module();
          break;
        case 1:
          obj = new module(args[0]);
          break;
        case 2:
          obj = new module(args[0], args[1]);
          break;
        case 3:
          obj = new module(args[0], args[1], args[2]);
          break;
        case 4:
          obj = new module(args[0], args[1], args[2], args[3]);
          break;
        case 5:
          obj = new module(args[0], args[1], args[2], args[3], args[4]);
          break;
        case 6:
          obj = new module(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 7:
          obj = new module(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          break;
        case 8:
          obj = new module(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
          break;
        case 9:
          obj = new module(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
          break;
        case 10:
          obj = new module(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
          break;
        default:
          throw new Error("Max arguments : 10");
        }
      } else {
        obj = new module();
      }

      if (!!dependencies) {
        for ( var prop in dependencies) {
          var dep = dependencies[prop];
          obj[prop] = dep;
        }
      }
      var after = objConf["after"];
      if (!!after) {
        obj[after].call(obj, args);
      }
      future.notifyDone(obj);
    });
    return future.promise();
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

/**
 * Compact promise pattern implementation
 * (https://github.com/mathieumast/promise)
 * 
 * Version : 0.5.0
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
var Promise = {};
{
  var _P = function() {
    var _callbacks = {
      done : [],
      fail : [],
      progress : []
    };
    this.callbacks = function() {
      return {
        done : _callbacks.done.slice(),
        fail : _callbacks.fail.slice(),
        progress : _callbacks.progress.slice()
      };
    };
    this.then = function(done, fail, progress) {
      var addCallback = function(type, callback) {
        if (typeof callback === "function") {
          _callbacks[type].push(callback);
        }
      };
      addCallback("done", done);
      addCallback("fail", fail);
      addCallback("progress", progress);
    };
  };

  var _F = function() {
    var _step = "progress", _promise = new _P();
    this.promise = function() {
      return _promise;
    };
    this.then = function(done, fail, progress) {
      _promise.then(done, fail, progress);
    };
    this.notify = function(type, array) {
      if (_step === "progress") {
        _step = type;
        window.setTimeout(function() {
          var _callbacks = _promise.callbacks();
          for ( var i = 0; i < _callbacks[type].length; i++) {
            var callback = _callbacks[type][i];
            callback.apply(_promise, array);
          }
        }, 1);
      }
    };
  };
  _F.prototype.notifyDone = function() {
    this.notify("done", Array.prototype.slice.call(arguments));
  };
  _F.prototype.notifyFail = function() {
    this.notify("fail", Array.prototype.slice.call(arguments));
  };
  _F.prototype.notifyProgress = function() {
    this.notify("progress", Array.prototype.slice.call(arguments));
  };

  var _W = function(promises) {
    var _future = new _F(), _results = [], _remaining = promises.length;
    for ( var i = 0; i < promises.length; i++) {
      promises[i].index = i;
      promises[i].then(function(obj) {
        _results[this.index] = obj;
        if (--_remaining === 0) {
          var joinObjs = [];
          for ( var j = 0; j < _results.length; j++) {
            joinObjs.push(_results[j]);
          }
          _F.prototype.notifyDone.apply(_future, joinObjs);
        } else {
          _future.notifyProgress(obj);
        }
      }, function(obj) {
        _future.notifyFail(obj);
      }, function(obj) {
        _future.notifyProgress(obj);
      });
    }
    this.promise = function() {
      return _future.promise();
    };
    this.then = function(done, fail, progress) {
      _future.then(done, fail, progress);
    };
  };

  Promise.future = function() {
    return new _F();
  };
  Promise.when = function() {
    return new _W(Array.prototype.slice.call(arguments));
  };
};