requirejs.config({
  paths : {
    ioc : "ioc",
    text : "ext/require-plugins/text",
    string : "ext/require-plugins/string",
    underscore : "ext/underscore"
  },
  shim : {
    underscore : {
      exports : "_",
    }
  },
  ioc : {

    // singleton is a singleton construct with AMD module Obj1
    singleton : {
      module : "Obj1",
      scope : "singleton",
      inject : {
        // Inject string "toto" via string plugin
        string : "toto"
      },
      // function "initialize" is called after injection
      after : "initialize"
    },

    // prototype is a prototype construct with AMD module Obj2
    prototype : {
      module : "Obj2",
      scope : "prototype",
      inject : {
        // Inject string "toto" via string plugin
        string : "toto"
      },
      // function "initialize" is called after injection
      after : "initialize"
    },

    // a is a singleton construct with AMD module Obj3
    a : {
      module : "Obj3",
      scope : "singleton",
      inject : {
        // Inject other AMD modules (a, b and c) managed by ioc.js
        b : "=>ioc!b",
        c : "=>ioc!c",
        d : "=>ioc!d"
      }
    },

    // b is a singleton construct with AMD module Obj3
    b : {
      module : "Obj3",
      scope : "singleton",
    },

    // c is a singleton construct with AMD module Obj3
    c : {
      module : "Obj3",
      scope : "singleton",
      inject : {
        // Inject content of file via text plugin
        file : "=>text!file.txt",
        // Inject string "titi"
        string : "titi",
        // Inject number 50
        number : 50,
        // Inject object
        obj : {
          a : "a"
        }
      }
    },

    // d is a singleton construct with AMD module Obj3
    d : {
      module : "Obj3",
      scope : "singleton",
      inject : {
        // Inject AMD module managed by ioc.js
        e : "=>ioc!e"
      }
    },

    // e is a singleton construct with AMD module Obj3
    e : {
      module : "Obj3",
      scope : "singleton",
      inject : {
        // Inject string "toto"
        string : "toto"
      }
    },

    // args is a singleton construct with AMD module Obj3 and arguments
    args : {
      module : "Obj4",
      scope : "singleton",
      args : [
        "=>ioc!e",
        "=>text!file.txt"
      ]
    }
  }
});
