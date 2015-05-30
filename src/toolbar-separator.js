/*
 * Toolbar separator.
 */ 

(function() {
    module.exports = ToolbarSeparator;
     
    function ToolbarSeparator() {

    }

    ToolbarSeparator.prototype.createComponent = function() {
        var div = this.el = document.createElement('div');
        div.setAttribute('class', 'separator');
        return div;
    };
}).call(this);