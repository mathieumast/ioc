define([ "underscore" ], function(_) {

  var Obj = function(args) {
    this.args = args;
  };

  _.extend(Obj.prototype, {

    /**
     * Function called after injection if it's configured.
     */
    initialize : function() {
    }
  });

  return Obj;
});