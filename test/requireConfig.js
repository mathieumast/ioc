requirejs.config({
  paths : {
    ioc : "ioc",
    text : "ext/require-plugins/text",
    string : "ext/require-plugins/string",
    number : "ext/require-plugins/number",
    underscore : "ext/underscore",
    chai : "ext/chai"
  },
  shim : {
    underscore : {
      exports : "_",
    }
  },
  deps : [ "chai", "underscore" ],
  ioc : {
    a : {
      construct : "A",
      scope : "singleton",
      inject : {
        b : "ioc!b",
        c : "ioc!c",
        e : "ioc!e"
      }
    },

    b : {
      construct : "B",
      scope : "singleton",
      inject : {
        d : "ioc!d"
      },
      after : "initialize"
    },

    c : {
      construct : "C",
      scope : "singleton",
      inject : {
        file : "text!file.txt",
        string : "string!blabla",
        number : "number!50"
      }
    },

    d : {
      construct : "D",
      inject : {
        string : "string!titi",
      },
      scope : "singleton"
    },

    e : {
      construct : "E",
      scope : "prototype",
      inject : {
        string : "string!tata"
      },
      after : "initialize"
    }
  }
});
