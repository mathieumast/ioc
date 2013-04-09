define([ "underscore" ], function(_) {

  var Obj = function() {
    this.args = Array.prototype.slice.call(arguments);
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