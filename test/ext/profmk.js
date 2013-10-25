/*
 * Compact promise pattern implementation and more. (https://github.com/mathieumast/profmk)
 * 
 * Version : 0.7.2
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
(function() {
    'use strict';
    var profmk = {};

    /*
     * Slice array or arguments.
     */
    profmk.slice = function(array, start, end) {
        if (!!end)
            return Array.prototype.slice.call(array, start, end);
        else if (!!start)
            return Array.prototype.slice.call(array, start);
        else
            return Array.prototype.slice.call(array);
    };

    /*
     * Invoke function for context and many arguments.
     */
    profmk.invoke = function(context, func) {
        return func.apply(context, profmk.slice(arguments, 2));
    };

    /*
     * Asynchrone invoke function for context and many arguments and return promise.
     */
    profmk.async = function(context, func) {
        var _future = profmk.future(), args = profmk.slice(arguments, 2);
        setTimeout(function() {
            _future.notifyDone(func.apply(context, args));
        }, 1);
        return _future.promise();
    };

    /*
     * Returns the index of item in the array or -1 if item is not found.
     */
    profmk.indexOf = Array.prototype.indexOf || function(array, item) {
        var i = 0, l = array.length;
        for (; i < l; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    };

    /*
     * Returns true if value is undefined.
     */
    profmk.isUndefined = function(value) {
        return !value ? typeof value == 'undefined' : false;
    };

    /*
     * Returns true if value is null.
     */
    profmk.isNull = function(value) {
        return value === null;
    };

    /*
     * Returns true if value is an object.
     */
    profmk.isObject = function(value) {
        return !value ? false : value === Object(value);
    };

    /*
     * Returns true if value is an boolean.
     */
    profmk.isBoolean = function(value) {
        return (value === true || value === false || Object.prototype.toString.call(value) == '[object Boolean]');
    };

    /*
     * Function isArray, isObject, isFunction, isString, isNumber, isDate, isRegExp.
     */
    var typesElems = ['Array', 'Function', 'String', 'Number', 'Date', 'RegExp'];
    for (var i = 0; i < typesElems.length; i++) {
        profmk.invoke(profmk, function(type) {
            this['is' + type] = function(value) {
                return !value ? false : Object.prototype.toString.call(value) == '[object ' + type + ']';
            };
        }, typesElems[i]);
    }

    /*
     * Extend object.
     */
    profmk.extend = function(dest) {
        var args = profmk.slice(arguments, 1), i = 0, l = args.length, prop;
        for (; i < l; i++) {
            for (prop in args[i]) {
                dest[prop] = args[i][prop];
            }
        }
        return dest;
    };

    /*
     * Create a new instance of function and arguments in array.
     */
    profmk.instantiate = function(func, array) {
        var i = 0, l = profmk.isArray(array) ? array.length : 0, q = [];
        switch (l) {
            case 0:
                return new func();
            case 1:
                return new func(array[0]);
            case 2:
                return new func(array[0], array[1]);
            case 3:
                return new func(array[0], array[1], array[2]);
            case 4:
                return new func(array[0], array[1], array[2], array[3]);
            default:
                for (; i < l; i++) {
                    q.push('array[' + i + ']');
                }
                return eval('new func(' + q.join(',') + ');');
        }
    };

    /*
     * Subscriber definition.
     */
    var _Subscriber = function(channel, callback, priority, context) {
        this.channel = channel;
        this.originalCallback = callback;
        this.callback = callback;
        this.priority = priority ? priority : 10;
        this.context = context ? context : profmk;
    };
    /*
     * Register implementation.
     */
    var _Register = function(subscribersMap) {
        var _subscribersMap = subscribersMap;
        /*
         * Subscribe.
         */
        this.subscribe = function(subscriber) {
            if (!_subscribersMap[subscriber.channel])
                _subscribersMap[subscriber.channel] = [];
            if (!profmk.isFunction(subscriber.callback))
                return this;
            var subs = _subscribersMap[subscriber.channel], i = subs.length - 1;
            subscriber.i = i + 1;
            for (; i >= 0; i--) {
                if (subscriber.priority >= subs[i].priority) {
                    subs.splice(i + 1, 0, subscriber);
                    return this;
                }
            }
            subs.unshift(subscriber);
            return this;
        };
        /*
         * Unsubscribe.
         */
        this.unsubscribe = function(channel, callback) {
            if (!_subscribersMap[channel])
                return this;
            if (!callback)
                _subscribersMap[channel] = null;
            else {
                var array = _subscribersMap[channel], i = array.length - 1;
                for (; i >= 0; i--) {
                    if (array[i].originalCallback === callback)
                        array.splice(i, 1);
                }
            }
            return this;
        };
    };

    /*
     * Publisher implementation.
     */
    var _Publisher = function(subscribersMap) {
        var _subscribersMap = subscribersMap;
        /*
         * Publish data in array.
         */
        this.publishArray = function(channel, array) {
            profmk.async(this, function() {
                if (!_subscribersMap[channel])
                  _subscribersMap[channel] = [];
                var subs = profmk.slice(_subscribersMap[channel]), i = 0, l = !subs ? 0 : subs.length;
                for (; i < l; i++) {
                    if (subs[i].callback.apply(subs[i].context, array) === false)
                        return false;
                }
                return true;
            });
        };
    };

    /*
     * Mediator implementation.
     */
    var _Mediator = function() {
        var _subscribersMap = {};
        this._register = new _Register(_subscribersMap);
        this._publisher = new _Publisher(_subscribersMap);
    };
    /*
     * Add subscriber.
     */
    _Mediator.prototype.subscribe = function(channel, callback, priority, context) {
        this._register.subscribe(new _Subscriber(channel, callback, priority, context));
        return this;
    };
    /*
     * Add subscriber for one event.
     */
    _Mediator.prototype.subscribeOnce = function(channel, callback, priority, context) {
        var sub = new _Subscriber(channel, callback, priority, context), self = this;
        sub.callback = function() {
            var res = sub.originalCallback.apply(context, arguments);
            self._register.unsubscribe(sub.channel, sub.originalCallback);
            return res;
        };
        this._register.subscribe(sub);
        return this;
    };
    /*
     * Remove subscriber.
     */
    _Mediator.prototype.unsubscribe = function(channel, callback) {
        this._register.unsubscribe(channel, callback);
        return this;
    };
    /*
     * Publish data in arguments.
     */
    _Mediator.prototype.publish = function(channel) {
        return this._publisher.publishArray(channel, profmk.slice(arguments, 1));
    };
    /*
     * Publish data in array.
     */
    _Mediator.prototype.publishArray = function(channel, array) {
        return this._publisher.publishArray(channel, array);
    };
    /*
     * Get a new Mediator object.
     */
    profmk.mediator = function() {
        return new _Mediator();
    };

    /*
     * Promise implementation.
     */
    var _Promise = function(subscribersMap) {
        this._register = new _Register(subscribersMap);
    };
    /*
     * Add handlers to be called when the Promise object is done, failed, or still in progress.
     */
    _Promise.prototype.then = function(done, fail, progress, context) {
        this._register.subscribe(new _Subscriber('done', done, null, context));
        this._register.subscribe(new _Subscriber('fail', fail, null, context));
        this._register.subscribe(new _Subscriber('progress', progress, null, context));
        return this;
    };

    /*
     * Future implementation.
     */
    var _Future = function() {
        var _step = 'progress', _subscribersMap = {}, _promise = new _Promise(_subscribersMap), _publisher = new _Publisher(_subscribersMap);
        this.context = this;
        this._notify = function(type, array) {
            if (_step === 'progress') {
                _step = type;
                _publisher.publishArray(type, array);
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
     * Function notifyDone, notifyFail, notifyProgress : notify that the Future object is Done, Fail, Progress.
     */
    _Future.prototype.notifyDone = function() {
        return this._notify('done', profmk.slice(arguments));
    };
    /*
     * Notify that the Future object is failed.
     */
    _Future.prototype.notifyFail = function() {
        return this._notify('fail', profmk.slice(arguments));
    };
    /*
     * Notify that the Future object is in progress.
     */
    _Future.prototype.notifyProgress = function() {
        return this._notify('progress', profmk.slice(arguments));
    };
    /*
     * Get a new Future object.
     */
    profmk.future = function() {
        return new _Future();
    };

    /*
     * When implementation.
     */
    var _When = function(objs) {
        profmk.extend(this, new _Future());
        var _results = [], _remaining = objs.length, i = 0, l = objs.length, _self = this;
        for (; i < l; i++) {
            var elem = objs[i], promise;
            if (profmk.isUndefined(elem) || profmk.isNull(elem))
                promise = profmk.future().notifyDone(null).promise();
            else if (profmk.isFunction(elem.then))
                promise = profmk.isFunction(elem.promise) ? elem.promise() : elem;
            else if (profmk.isFunction(elem))
                promise = profmk.async(_self, elem, profmk.slice(arguments, 2));
            else
                promise = profmk.future().notifyDone(elem).promise();
            profmk.invoke(_self, function(i, promise) {
                promise.then(function(obj) {
                    _results[i] = obj;
                    if (--_remaining === 0) {
                        _Future.prototype.notifyDone.apply(_self.context, _results);
                    } else {
                        _self.context.notifyProgress(obj);
                    }
                }, function(obj) {
                    _self.context.notifyFail(obj);
                }, function(obj) {
                    _self.context.notifyProgress(obj);
                });
            }, i, promise);
        }
    };
    profmk.extend(_When.prototype, _Future.prototype);
    /*
     * Get a new When object.
     */
    profmk.when = function() {
        var when = new _When(profmk.slice(arguments));
        return when.promise();
    };

    /*
     * Get a new Wait object.
     */
    profmk.wait = function(ms) {
        var future = profmk.future(), objs = [future].concat(profmk.slice(arguments, 1)), when = new _When(objs);
        setTimeout(function() {
            future.notifyDone(ms);
        }, ms);
        return when.promise();
    };

    /*
     * Get a new Timeout object.
     */
    profmk.timeout = function(ms) {
        var when = new _When([ms].concat(profmk.slice(arguments, 1)));
        setTimeout(function() {
            when.notifyFail('Timeout error');
        }, ms);
        return when.promise();
    };

    /*
     * Export profmk.
     */
    if (typeof define == 'function' && define.amd) {
        define('profmk', function() {
            return profmk;
        });
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = profmk;
    } else {
        var root = this;
        root['profmk'] = profmk;
    }
}).call(this);