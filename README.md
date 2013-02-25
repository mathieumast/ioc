# ioc.js

Inversion of control (IoC) for [RequireJS](http://requirejs.org/).

This plugin allow injection in AMD modules.

## Features

* Dependencies injection for RequireJS modules.
* Simple configuration via the [RequireJS config](http://requirejs.org/docs/api.html#config).
* fully compatible with other requireJS plugins.

## Configuration

Configure the ioc.js plugin and all injections via the [RequireJS config](http://requirejs.org/docs/api.html#config):

```js
requirejs.config({

  paths : {
    ioc : "path/to/ioc"
  },

  ioc : {

    // object1 is a singleton construct with AMD module Object
    object1 : {
      module : "Object", // Object is a AMD module
      scope : "singleton",
      // Construction arguments
      args : [
        50, // Value
        {a : "a", b : "b"}, // Object
        object2 : "=>ioc!object2" // AMD module object2 (module is going to load by ioc.js plugin)
      ],
      // dependencies injection
      inject : {
        value : 50, // Value
        person : {firstname : "John", lastname : "Doe"}, // Object
        module : "=>module", // AMD module (module is going to load by RequireJS)
        object2 : "=>ioc!object2" // AMD module object2 (module is going to load by ioc.js plugin)
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

* `module`: AMD module use to construct object.
* `scope`: scope of object - `singleton` or `prototype`.
* `args`: construction arguments.
* `inject`: injection after construction.
* `after`: callback function called after injection.

References to others AMD module are defined with `=>`.

See configuration example defined in file [requireConfig.js](test/requireConfig.js).

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

