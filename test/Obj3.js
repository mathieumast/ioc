define(function() {

  var Obj = function() {
    this.args = Array.prototype.slice.call(arguments);
  };

    /**
     * Function called after injection if it's configured.
     */
    Obj.prototype.initialize = function() {
    };

  return Obj;
});