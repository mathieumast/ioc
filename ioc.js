/**
 * IoC for RequireJS Plugin (https://github.com/mathieumast/ioc)
 * 
 * Version : 0.8.1
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(["profmk"], function(profmk) {
    "use strict";

    /**
     * ioc plugin.
     */
    var ioc = {};

    /**
     * Get configuration.
     */
    ioc.getConf = function(name, req, onload, config) {
        var iocConf = config["ioc"];
        if (profmk.isObject(iocConf)) {
            var objConf = iocConf[name];
            if (!profmk.isObject(objConf)) {
                objConf = {};
            }
        }

        var module = objConf["module"];
        if (!module) {
            var res = name.split("|");
            if (res.length === 0 || res.length === 1) {
                objConf["module"] = name;
            } else if (res.length >= 2) {
                objConf["module"] = res[0];
                objConf["scope"] = res[1];
            }
        }

        var scope = objConf["scope"];
        if ("singleton" !== scope && "prototype" !== scope) {
            objConf["scope"] = "singleton";
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

        profmk.when(res1, res2).then(function(args, injects) {
            ioc.createObj(args, injects, name, req, onload, config).then(function(obj) {
                ioc.finalize(obj, name, req, onload, config);
            }, error);
        }, error);
    };

    /**
     * Load dependencies.
     */
    ioc.loadDependencies = function(depsToLoad, name, req, onload, config) {
        var future = profmk.future();
        var dependencies;
        if (profmk.isArray(depsToLoad)) {
            dependencies = [];
        } else {
            dependencies = {};
        }
        var nb = 0;
        var tempDeps = [];
        var tempProps = [];
        if (!!depsToLoad) {
            for (var prop in depsToLoad) {
                var elem = depsToLoad[prop];
                if (profmk.isString(elem) && elem.match(/^\=\>/) !== null) {
                    // It's a string, dependency is a AMD module
                    var moduleName;
                    if (elem.match(/!/)) {
                        moduleName = elem.substring(2);
                    } else {
                        moduleName = req.toUrl(elem.substring(2));
                    }
                    if (-1 === profmk.indexOf(tempDeps, moduleName)) {
                        nb++;
                        if (profmk.isArray(depsToLoad)) {
                            dependencies.push(null);
                        } else {
                            dependencies[prop] = null;
                        }
                        tempDeps.push(moduleName);
                        tempProps.push(prop);
                    }
                } else {
                    // Dependency is not a AMD module
                    if (profmk.isArray(depsToLoad)) {
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
                for (var i = 0; i < nb; i++) {
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
        var future = profmk.future();
        var objConf = ioc.getConf(name, req, onload, config);
        var moduleName = objConf["module"];
        req([moduleName], function(module) {
            var obj = profmk.instantiate(module, args);
            if (!!dependencies) {
                profmk.extend(obj, dependencies);
            }
            var after = objConf["after"];
            if (!!after && !!obj[after]) {
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