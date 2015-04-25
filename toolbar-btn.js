/*
 * Toolbar button.
 */ 

(function() {
    module.exports = ToolbarButton;
 
    /*
     * Section: Construction and Destruction
     */
     
    function ToolbarButton(imgClass, disabled, right, text) {
        this.text = text;
        this.right = right;
        this.imgClass = imgClass;
        this.disabled = disabled;
    }

    ToolbarButton.prototype.createComponent = function() {
        var div = this.el = document.createElement('div');
        var clazz = 'tb ' + this.imgClass;
        clazz += (this.disabled ? ' tb-disabled' : '');
        clazz += this.right ? ' right': '';
        div.setAttribute('class', clazz);
        div.onclick = this.onClick;
        
        if (this.text) {
            var txt = document.createElement('span');
            txt.textContent = this.text;
            div.appendChild(txt);
        }
        
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
    
    ToolbarButton.prototype.setText = function(text) {
        this.el.firstChild.textContent = text; 
    };
    
    ToolbarButton.prototype.activate = function(clazz) {
        this.active = true;
        this.el.className += ' ' + clazz;
    };
    
    ToolbarButton.prototype.deactivate = function(clazz) {
        this.active = false;
        this.el.classList.remove(clazz);
    };
    
    ToolbarButton.prototype.onClick = function() {
    };
}).call(this);