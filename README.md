# ioc.js

Inversion of control (IoC) for [RequireJS](http://requirejs.org/).

This plugin allow injection between AMD modules.

## Features

* Dependencies injection for RequireJS modules.
* Simple configuration via the [RequireJS config](http://requirejs.org/docs/api.html#config).
* fully compatible with other requireJS plugins.

## Configuration

Configure the ioc.js plugin and all injections via the [RequireJS config](http://requirejs.org/docs/api.html#config):

```js
requirejs.config({

  paths : {
    ioc : "ioc"
  },

  ioc : {

    // object is a singleton construct with AMD module Object
    object : {
      module : "Object", // Object is a AMD module
      scope : "singleton",
      inject : {
        // Inject value 50
        value : 50,
        // Inject object
        person : {firstname:"John",lastname:"Doe"},
        // Inject other AMD module object2 managed by ioc.js
        object2 : "ioc!object2"
      },
      // function "initialize" is called after injection
      after : "initialize"
    },

    // object is a prototype construct with AMD module Object2
    object2 : {
      module : "Object2",
      scope : "prototype"
    }

  }

}
```


See configuration example defined in file [requireConfig.js](test/requireConfig.js).

Tips:

* to inject a string use RequireJS plugins [string.js](test/ext/require-plugins/string.js).

## Get managed object

```js
require([ "ioc!object" ], function(object) {
  // object has the injected properties "value ", "person" and "object2"
});
```

See example defined in file [test.js](test/test.js).

## License

Copyright (C) 2013 Mathieu MAST.

Released under the MIT license.

