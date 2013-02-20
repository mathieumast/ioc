/**
 * RequireJS Plugin for construct Number
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(function() {
  "use strict";

  var number = {

    load : function(name, req, onload, config) {
      onload(+name);
    }

  };

  return number;
});