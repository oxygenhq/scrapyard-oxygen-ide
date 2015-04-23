/*
 * Toolbar button.
 */ 

(function() {
    module.exports = ToolbarButton;
 
    /*
     * Section: Construction and Destruction
     */
     
    function ToolbarButton(imgClass, disabled) {
        this.imgClass = imgClass;
        this.disabled = disabled;
    }

    ToolbarButton.prototype.createComponent = function() {
        var div = this.el = document.createElement('div');
        div.setAttribute('class', 'tb ' + this.imgClass + ' ' + (this.disabled ? 'tb-disabled' : ''));
        div.onclick = this.onClick;
        return div;
    };
  
    /*
     * Section: Methods
     */

    ToolbarButton.prototype.disable = function() {
        this.disabled = true;
        this.el.className = this.el.className + ' tb-disabled';
    };

    ToolbarButton.prototype.enable = function() {
        this.disabled = false;
        this.el.className = this.el.className.replace(/\btb-disabled\b/,'');
    };

    ToolbarButton.prototype.onClick = function() {
    };
}).call(this);