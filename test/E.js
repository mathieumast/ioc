define(function() {

  var num = 0;

  var E = function() {
  };

  _.extend(E.prototype, {

    num : 0,

    /**
     * Function called after injection if it's configured.
     */
    initialize : function() {
      console.log("initializing E");
      num++;
      this.num = num;
      console.log(this.num);
    }
  });

  return E;
});