define(function() {

    var num = 0;

    var Obj = function() {
        this.args = Array.prototype.slice.call(arguments);
    };

    Obj.prototype.num = 0;

    /**
     * Function called after injection if it's configured.
     */
    Obj.prototype.initialize = function() {
        num++;
        this.num = num;
    };

    return Obj;
});