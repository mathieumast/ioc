/**
 * Compact promise pattern implementation and more. (https://github.com/mathieumast/profmk)
 * 
 * Version : 0.5.5
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
(function() {
    "use strict";

    var profmk = {};

    profmk.errors = {
        timeout: "Timeout error"
    };

    /**
     * Slice object (array or arguments).
     */
    profmk.slice = function(obj, start, end) {
        if (!!end) {
            return Array.prototype.slice.call(obj, start, end);
        } else if (!!start) {
            return Array.prototype.slice.call(obj, start);
        } else {
            return Array.prototype.slice.call(obj);
        }
    };

    /**
     * Invoke function for context and many arguments and return promise.
     */
    profmk.invoke = function(context, func) {
        var res = func.apply(context, profmk.slice(arguments, 2));
        return profmk.future().notifyDone(res).promise();
    };

    /**
     * Returns the index of item in the array or -1 if item is not found.
     */
    profmk.indexOf = Array.prototype.indexOf || function(array, item) {
        var i = 0, l = array.length;
        for (; i < l; i++)
            if (array[i] === item)
                return i;
        return -1;
    };

    /**
     * Extend object.
     */
    profmk.extend = function(dest) {
        var args = profmk.slice(arguments, 1), i = 0, l = args.length;
        for (; i < l; i++) {
            var source = args[i];
            for (var prop in source) {
                dest[prop] = source[prop];
            }
        }
        return dest;
    };

    /**
     * Create a new instance of function and arguments.
     */
    profmk.instantiate = function(func, args) {
        if (profmk.isArray(args)) {
            var obj;
            switch (args.length) {
                case 0:
                    obj = new func();
                    break;
                case 1:
                    obj = new func(args[0]);
                    break;
                case 2:
                    obj = new func(args[0], args[1]);
                    break;
                case 3:
                    obj = new func(args[0], args[1], args[2]);
                    break;
                case 4:
                    obj = new func(args[0], args[1], args[2], args[3]);
                    break;
                default:
                    var q = [];
                    for (var i = 0; i < args.length; i++) {
                        q.push("args[" + i + "]");
                    }
                    obj = eval("new func(" + q.join(",") + ")");
            }
            return obj;
        } else {
            return new func();
        }
    };

    /*
     * Promise implementation.
     */
    var _Promise = function() {
        var _callbacks = {
            done: [],
            fail: [],
            progress: []
        };
        /*
         * Return copy of callbacks.
         */
        this.callbacks = function() {
            return {
                done: profmk.slice(_callbacks.done),
                fail: profmk.slice(_callbacks.fail),
                progress: profmk.slice(_callbacks.progress)
            };
        };
        /*
         * Add handlers to be called when the Promise object is done, failed, or still in progress.
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

    /*
     * Future implementation.
     */
    var _Future = function() {
        var _step = "progress", _promise = new _Promise(), _ctx = this;
        this._notify = function(type, array) {
            if (_step === "progress") {
                _step = type;
                setTimeout(function() {
                    var _callbacks = _promise.callbacks();
                    for (var i = 0; i < _callbacks[type].length; i++) {
                        var callback = _callbacks[type][i];
                        callback.apply(_ctx, array);
                    }
                }, 1);
            }
            return this;
        };
        /*
         * Return promise instance.
         */
        this.promise = function() {
            return _promise;
        };
    };
    /*
     * Add handlers to be called when the Future object is done, failed, or still in progress.
     */
    _Future.prototype.then = function(done, fail, progress) {
        this.promise().then(done, fail, progress);
    };
    /*
     * Notify that the Future object is done.
     */
    _Future.prototype.notifyDone = function() {
        return this._notify("done", profmk.slice(arguments));
    };
    /*
     * Notify that the Future object is failed.
     */
    _Future.prototype.notifyFail = function() {
        return this._notify("fail", profmk.slice(arguments));
    };
    /*
     * Notify that the Future object is in progress.
     */
    _Future.prototype.notifyProgress = function() {
        return this._notify("progress", profmk.slice(arguments));
    };
    /**
     * Get a new future object.
     */
    profmk.future = function() {
        return new _Future();
    };

    /*
     * When implementation.
     */
    var _When = function(objs) {
        profmk.extend(this, new _Future());
        var _results = [], _remaining = objs.length, _ctx = this;
        for (var i = 0; i < objs.length; i++) {
            var elem = objs[i], promise;
            if (profmk.isUndefined(elem) || profmk.isNull(elem)) {
                promise = profmk.future().notifyDone(null).promise();
            } else if (profmk.isFunction(elem.then)) {
                promise = profmk.isFunction(elem.promise) ? elem.promise() : elem;
            } else if (profmk.isFunction(elem)) {
                var res = elem.apply(this, profmk.slice(arguments, 2));
                promise = profmk.future().notifyDone(res).promise();
            } else {
                promise = profmk.future().notifyDone(elem).promise();
                ;
            }
            profmk.invoke(_ctx, function(i, promise) {
                promise.then(function(obj) {
                    _results[i] = obj;
                    if (--_remaining === 0) {
                        _Future.prototype.notifyDone.apply(_ctx, _results);
                    } else {
                        _ctx.notifyProgress(obj);
                    }
                }, function(obj) {
                    _ctx.notifyFail(obj);
                }, function(obj) {
                    _ctx.notifyProgress(obj);
                });
            }, i, promise);
        }
    };
    profmk.extend(_When.prototype, _Future.prototype);
    /**
     * Get a new when promise object.
     */
    profmk.when = function() {
        var when = new _When(profmk.slice(arguments));
        return when.promise();
    };

    /**
     * Get a new wait promise object.
     */
    profmk.wait = function(ms) {
        var future = profmk.future(), objs = [future].concat(profmk.slice(arguments, 1));
        var when = new _When(objs);
        setTimeout(function() {
            future.notifyDone(ms);
        }, ms);
        return when.promise();
    };

    /**
     * Get a new timeout promise object.
     */
    profmk.timeout = function(ms) {
        var when = new _When([ms].concat(profmk.slice(arguments, 1)));
        setTimeout(function() {
            when.notifyFail(profmk.errors.timeout);
        }, ms);
        return when.promise();
    };

    /*
     * Function isArray, isObject, isFunction, isString, isBoolean, isNumber, isDate, isRegExp, isUndefined, isNull.
     */
    var types = ["Array", "Object", "Function", "String", "Boolean", "Number", "Date", "RegExp", "Undefined", "Null"];
    for (var i = 0; i < types.length; i++) {
        profmk.invoke(profmk, function(type) {
            profmk["is" + type] = function(obj) {
                return (Object.prototype.toString.call(obj) == "[object " + type + "]");
            };
        }, types[i]);
    }

    /*
     * Export profmk.
     */
    if (typeof define === "function" && define.amd) {
        define("profmk", function() {
            return profmk;
        });
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = profmk;
    } else {
        var root = this;
        root["profmk"] = profmk;
    }
}).call(this);