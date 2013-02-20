/**
 * IoC for RequireJS Plugin
 * 
 * Version : 0.1
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
    }
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

    this.notifySuccess = function(args) {
      var self = this;
      window.setTimeout(function() {
        for ( var i = 0; i < self._sucesses.length; i++) {
          callFunction(self._sucesses[i], self._ctx, args);
        }
      });
    };
  };

  var ioc = {

    /**
     * Get configuration.
     */
    getConf : function(name, req, onload, config) {
      var iocConf = config["ioc"]
      if (!iocConf) {
        onload.error("No inject configuration !");
        return null;
      }
      var objConf = iocConf[name];
      if (!objConf) {
        onload.error("No IoC configuration for " + name);
        return null;
      }
      return objConf;
    },

    /**
     * Load object.
     */
    load : function(name, req, onload, config) {
      var objConf = ioc.getConf(name, req, onload, config);
      if (null === objConf)
        return;

      var scope = objConf["scope"];
      if ("singleton" !== scope && "prototype" !== scope) {
        onload.error("'scope' must be singleton or prototype for " + name);
        return null;
      }

      var construct = objConf["construct"];
      if (!construct) {
        onload.error("'construct' must be defined for " + name);
      }

      ioc.loadDependencies(objConf, name, req, onload, config).success(function(dependencies) {
        ioc.createObj(dependencies, name, req, onload, config).success(function(obj) {
          ioc.finalize(obj, name, req, onload, config);
        });
      });
    },

    /**
     * Load dependencies.
     */
    loadDependencies : function(objConf, name, req, onload, config) {
      var promise = new Promise(this);
      var dependencies = {};
      var nb = 0;
      var inject = objConf["inject"];
      var tempDeps = [];
      var tempProps = [];
      if (!!inject) {
        for ( var prop in inject) {
          var elem = inject[prop];
          if (!isInArray(tempDeps, elem)) {
            nb++;
            tempDeps.push(elem);
            tempProps.push(prop);
          }
        }
      }
      if (nb > 0) {
        req(tempDeps, function() {
          for ( var i = 0; i < nb; i++) {
            var prop = tempProps[i];
            var dep = arguments[i];
            dependencies[prop] = dep;
          }
          promise.notifySuccess(dependencies);
        });
      } else {
        promise.notifySuccess(dependencies);
      }
      return promise;
    },

    /**
     * Create object and inject dependencies.
     */
    createObj : function(dependencies, name, req, onload, config) {
      var promise = new Promise(this);
      var objConf = ioc.getConf(name, req, onload, config);
      var construct = objConf["construct"];
      req([ construct ], function(module) {
        var obj = new module();
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
    },

    /**
     * Finalize requiring.
     */
    finalize : function(obj, name, req, onload, config) {
      var objConf = ioc.getConf(name, req, onload, config);
      onload(obj);
      var scope = objConf["scope"];
      if ("prototype" === scope) {
        // Remove proto from Require cache for scope prototype
        req.undef("ioc!" + name);
      }
    }

  };

  return ioc;
});
