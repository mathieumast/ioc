/*
 * Compact promise pattern implementation and more. (https://github.com/mathieumast/profmk)
 * 
 * Version : 0.7.0
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
        for (; i < l; i++)
            if (array[i] === item)
                return i;
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
        for (; i < l; i++)
            for (prop in args[i])
                dest[prop] = args[i][prop];
        return dest;
    };

    /*
     * Create a new instance of function and arguments in array.
     */
    profmk.instantiate = function(func, array) {
        var i = 0, l = array.length, q = [];
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
                for (; i < l; i++)
                    q.push('array[' + i + ']');
                return eval('new func(' + q.join(',') + ');');
        }
    };

    /*
     * Subcription implementation.
     */
    var _Subscription = function() {
        var _subscribers = {};
        /*
         * Add subscriber.
         */
        this.subscribe = function(channel, callback, priority, context) {
            if (!_subscribers[channel]) {
                _subscribers[channel] = {callbacks: [], priorities: [], contexts: []};
            }
            if (profmk.isFunction(callback)) {
                if (!profmk.isNumber(priority))
                    priority = 10;
                if (!context)
                    context = this;
                var _priorities = _subscribers[channel].priorities, _callbacks = _subscribers[channel].callbacks, _contexts = _subscribers[channel].contexts, i = _priorities.length - 1, lastpriority = 0;
                for (; i >= 0; i--) {
                    lastpriority = _priorities[i];
                    if (priority < lastpriority) {
                        _callbacks.splice(i + 1, 0, callback);
                        _priorities.splice(i + 1, 0, priority);
                        _contexts.splice(i + 1, 0, context);
                        break;
                    }
                }
                if (priority < lastpriority) {
                    _callbacks.unshift(callback);
                    _priorities.unshift(priority);
                    _contexts.unshift(context);
                } else {
                    _callbacks.push(callback);
                    _priorities.push(priority);
                    _contexts.push(context);
                }
            }
            return this;
        };
        /*
         * Remove subscriber.
         */
        this.unsubscribe = function(channel, callback) {
            if (!_subscribers[channel])
                return this;
            if (!callback)
                _subscribers[channel] = null;
            else {
                var _priorities = _subscribers[channel].priorities, _callbacks = _subscribers[channel].callbacks, _contexts = _subscribers[channel].contexts, i = _priorities.length - 1;
                for (; i >= 0; i--) {
                    if (_callbacks[i] === callback) {
                        _callbacks.splice(i, 1);
                        _priorities.splice(i, 1);
                        _contexts.splice(i, 1);
                    }
                }
            }
            return this;
        };
        /*
         * Return copy of callback subscribers for the channel.
         */
        this.callbacks = function(channel) {
            if (!_subscribers[channel])
                return [];
            return profmk.slice(_subscribers[channel].callbacks);
        };
        /*
         * Return copy of context subscribers for the channel.
         */
        this.contexts = function(channel) {
            if (!_subscribers[channel])
                return [];
            return profmk.slice(_subscribers[channel].contexts);
        };
    };

    /*
     * Publication implementation.
     */
    var _Publication = function(subscription) {
        /*
         * Publish data in array.
         */
        this.publishArray = function(channel, array) {
            profmk.async(this, function() {
                var _callbacks = subscription.callbacks(channel), _contexts = subscription.contexts(channel), i = 0, l = _callbacks.length;
                for (; i < l; i++)
                    if (_callbacks[i].apply(_contexts[i], array) === false)
                        return false;
                return true;
            });
        };
    };

    /*
     * Mediator implementation.
     */
    var _Mediator = function() {
        this._subscription = new _Subscription();
        this._publication = new _Publication(this._subscription);
    };
    /*
     * Add subscriber.
     */
    _Mediator.prototype.subscribe = function(channel, callback, priority, context) {
        this._subscription.subscribe(channel, callback, priority, context);
    };
    /*
     * Remove subscriber.
     */
    _Mediator.prototype.unsubscribe = function(channel, callback) {
        this._subscription.unsubscribe(channel, callback);
    };
    /*
     * Publish data in arguments.
     */
    _Mediator.prototype.publish = function(channel) {
        return this._publication.publishArray(channel, profmk.slice(arguments, 1));
    };
    /*
     * Publish data in array.
     */
    _Mediator.prototype.publishArray = function(channel, array) {
        return this._publication.publishArray(channel, array);
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
    var _Promise = function() {
        this._subscription = new _Subscription();
    };
    /*
     * Add handlers to be called when the Promise object is done, failed, or still in progress.
     */
    _Promise.prototype.then = function(done, fail, progress, context) {
        this._subscription.subscribe('done', done, context);
        this._subscription.subscribe('fail', fail, context);
        this._subscription.subscribe('progress', progress, context);
        return this;
    };

    /*
     * Future implementation.
     */
    var _Future = function() {
        var _step = 'progress', _promise = new _Promise(), _publication = new _Publication(_promise._subscription);
        this.context = this;
        this._notify = function(type, array) {
            if (_step === 'progress') {
                _step = type;
                _publication.publishArray(type, array);
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