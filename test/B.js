define(function() {

  var num = 0;

  var B = function() {
  };

  _.extend(B.prototype, {

    num : 0,

    /**
     * Function called after injection if it's configured.
     */
    initialize : function() {
      console.log("initializing B");
      num++;
      this.num = num;
      console.log(this.num);
    }
  });

  return B;
});