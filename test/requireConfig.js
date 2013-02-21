requirejs.config({
  paths : {
    ioc : "ioc",
    text : "ext/require-plugins/text",
    string : "ext/require-plugins/string",
    number : "ext/require-plugins/number",
    underscore : "ext/underscore"
  },
  shim : {
    underscore : {
      exports : "_",
    }
  },
  ioc : {
    singleton : {
      construct : "Obj1",
      scope : "singleton",
      inject : {
        string : "string!toto"
      },
      after : "initialize"
    },

    prototype : {
      construct : "Obj2",
      scope : "prototype",
      inject : {
        string : "string!toto"
      },
      after : "initialize"
    },

    a : {
      construct : "Obj3",
      scope : "singleton",
      inject : {
        b : "ioc!b",
        c : "ioc!c",
        d : "ioc!d"
      }
    },

    b : {
      construct : "Obj3",
      scope : "singleton",
    },

    c : {
      construct : "Obj3",
      scope : "singleton",
      inject : {
        file : "text!file.txt",
        string : "string!titi",
        number : "number!50"
      }
    },

    d : {
      construct : "Obj3",
      scope : "singleton",
      inject : {
        e : "ioc!e"
      }
    },

    e : {
      construct : "Obj3",
      scope : "singleton",
      inject : {
        string : "string!toto"
      }
    }
  }
});
