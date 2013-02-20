/**
 * RequireJS Plugin for construct String
 * 
 * Copyright (c) 2013, Mathieu MAST
 * 
 * Licensed under the MIT license
 */
define(function() {
  "use strict";

  var string = {

    load : function(name, req, onload, config) {
      onload(name);
    }

  };

  return string;
});