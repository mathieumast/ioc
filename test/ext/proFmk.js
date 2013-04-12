/**
 * Compact promise pattern implementation and more.
 * (https://github.com/mathieumast/proFmk)
 * 
 * Version : 0.5.0
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
(function() {
  "use strict";

  var proFmk = {};

  if (typeof define === "function" && define.amd) {
    define("proFmk", function() {
      return proFmk;
    });
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = proFmk;
  } else {
    var root = this;
    root["proFmk"] = proFmk;
  }

  /**
   * Promise implementation.
   */
  var _Promise = function() {
    var _callbacks = {
      done : [],
      fail : [],
      progress : []
    };
    /**
     * Return copy of callbacks.
     */
    this.callbacks = function() {
      return {
        done : slice(_callbacks.done),
        fail : slice(_callbacks.fail),
        progress : slice(_callbacks.progress)
      };
    };
    /**
     * Add handlers to be called when the Promise object is done, failed, or
     * still in progress.
     */
    this.then = function(done, fail, progress) {
      var addCallback = function(type, callback) {
        if (typeof callback === "function") {
          _callbacks[type].push(callback);
        }
      };
      addCallback("done", done);
      addCallback("fail", fail);
      addCallback("progress", progress);
      return this;
    };
  };

  /**
   * Future implementation.
   */
  var _Future = function() {
    var _step = "progress", _promise = new _Promise();
    this._notify = function(type, array) {
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
    /**
     * Return promise instance.
     */
    this.promise = function() {
      return _promise;
    };
    /**
     * Add handlers to be called when the Future object is done, failed, or
     * still in progress.
     */
    this.then = function(done, fail, progress) {
      _promise.then(done, fail, progress);
    };
  };
  /**
   * Notify that the Future object is done.
   */
  _Future.prototype.notifyDone = function() {
    this._notify("done", slice(arguments));
  };
  /**
   * Notify that the Future object is failed.
   */
  _Future.prototype.notifyFail = function() {
    this._notify("fail", slice(arguments));
  };
  /**
   * Notify that the Future object is in progress.
   */
  _Future.prototype.notifyProgress = function() {
    this._notify("progress", slice(arguments));
  };

  /**
   * When implementation.
   */
  var _When = function(promises) {
    var _future = new _Future(), _results = [], _remaining = promises.length;
    for ( var i = 0; i < promises.length; i++) {
      promises[i].index = i;
      promises[i].then(function(obj) {
        _results[this.index] = obj;
        if (--_remaining === 0) {
          var joinObjs = [];
          for ( var j = 0; j < _results.length; j++) {
            joinObjs.push(_results[j]);
          }
          _Future.prototype.notifyDone.apply(_future, joinObjs);
        } else {
          _future.notifyProgress(obj);
        }
      }, function(obj) {
        _future.notifyFail(obj);
      }, function(obj) {
        _future.notifyProgress(obj);
      });
    }
    /**
     * Return promise instance.
     */
    this.promise = function() {
      return _future.promise();
    };
    /**
     * Add handlers to be called when the Future object is done, failed, or
     * still in progress.
     */
    this.then = function(done, fail, progress) {
      _future.then(done, fail, progress);
    };
  };
  
  /**
   * Returns true if object is an array.
   */
  var isArray = Array.isArray || function(obj) {
    return toString.call(obj) == "[object Array]";
  };

  /**
   * Returns the index of item in the array or -1 if item is not found.
   */
  var indexOf = Array.prototype.indexOf || function(array, item) {
    var i = 0, l = array.length;
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };
  
  /**
   * Slice object (array or arguments).
   */
  var slice = function(obj, start, end) {
    return Array.prototype.slice.call(obj, start, end);
  };
  
  proFmk.future = function() {
    return new _Future();
  };
  proFmk.when = function() {
    return new _When(slice(arguments));
  };
  proFmk.isArray = isArray;
  proFmk.indexOf = indexOf;
  proFmk.slice = slice;
}).call(this);