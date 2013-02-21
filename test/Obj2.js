define([ "underscore" ], function(_) {

  var num = 0;

  var Obj = function() {
  };

  _.extend(Obj.prototype, {

    num : 0,

    /**
     * Function called after injection if it's configured.
     */
    initialize : function() {
      num++;
      this.num = num;
    }
  });

  return Obj;
});