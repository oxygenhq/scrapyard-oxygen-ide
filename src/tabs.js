/*
 * Tabs component.
 */ 

(function() {
    var __hasProp = {}.hasOwnProperty;
    var __extends = function(child,  parent) {  
        for(var key in parent) { 
            if (__hasProp.call(parent,  key)) {
                child[key] = parent[key]; 
            }
        } 
        function ctor() { 
            this.constructor = child; 
        } 
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;  
        return child;  
    };
          
    var Tabs = (function(_super) {
        __extends(Tabs, _super);

        
        /*
         * Section: Construction and Destruction
         */
         
        function Tabs() {
        }
        
        Tabs.prototype.attached = false;

        Tabs.prototype.createdCallback = function() {
            this.attached = false;
            this.initializeContent();
        };

        Tabs.prototype.attachedCallback = function() {
            this.attached = true;
        };

        Tabs.prototype.detachedCallback = function() {
            this.attached = false;
        };

        Tabs.prototype.initializeContent = function() {
            var tabLabels = this.tabLabels = document.createElement("div");
            tabLabels.setAttribute('id', 'tabLabels');
            this.appendChild(tabLabels);
            
            var tabContents = this.tabContents = document.createElement("div");
            tabContents.setAttribute('id', 'tabContents');
            this.appendChild(tabContents);

            this.add('Untitled');
        };
        
        Tabs.prototype.editors = [];
    
        /*
         * Section: Methods
         */
        
        /**
         * Create new tab with an embedded editor.
         * @param {String} title - Tab title.
         */
        Tabs.prototype.add = function(title) {
            // create label
            var label = document.createElement("div");
            label.setAttribute('class', 'label');
            
            var labelSpan = document.createElement("span");
            labelSpan.textContent = title;
            label.appendChild(labelSpan);

            this.tabLabels.appendChild(label);
            
            var self = this;
            
            function switchTo(i) {
                var contDivs = self.tabContents.children;
                var labelDivs = self.tabLabels.children;
                for (var c = 0; c < contDivs.length; c++) {
                    if (contDivs[c].className) {
                        contDivs[c].className = contDivs[c].className.replace(/[ ]+\bactive\b/,'');
                    }
                    if (labelDivs[c].className) {
                        labelDivs[c].className = labelDivs[c].className.replace(/[ ]+\bactive\b/,'');
                    } 
                }
                contDivs[i].className += " active";
                labelDivs[i].className += " active";
                
                self.currentEditor = self.editors[i];
                self.currentTabIndex = i;
            }

            label.onclick = function (e) {
                var tgt = e.target;
                if (tgt.tagName === 'SPAN') {
                    tgt = tgt.parentNode;
                }
                var items = tgt.parentNode.children;
                var i = 0;
                while (items[i] !== tgt) { 
                    i++;
                }
                switchTo(i);
            };

            var close = document.createElement("div");
            close.setAttribute('class', 'close');
            label.appendChild(close);
            
            close.onclick = function(e) {
                var tgt = e.target;
                var items = tgt.parentNode.parentNode.children;
                var i = 0;
                while (items[i] !== tgt.parentNode) { 
                    i++;
                }

                // remove the content
                var contDivs = self.tabContents.children;
                contDivs[i].remove();
                self.editors.splice(i, 1);
                
                // remove the label
                e.target.parentNode.remove();

                // show first available tab; either the previous tab or next
                if (contDivs.length > 0) {
                    switchTo(i-1 >= 0 ? i - 1 : 0);
                }

                e.stopPropagation();
            };
            
            // create content div
            var content = document.createElement("div");
            content.setAttribute('class', 'content');
            this.tabContents.appendChild(content);
            
            // editor
            var editor = new Editor(); 
            toolbar.btnSave.setClickHandler(function () { tabs.currentEditor.save(); });
            content.appendChild(editor);
            this.editors.push(editor);
            
            switchTo(this.tabLabels.children.length-1);
        };
        
        /**
         * Sets title of the currently active tab.
         * @param {String} title - Tab title.
         */
        Tabs.prototype.setCurrentTabTitle = function(title) {
            var label = this.tabLabels.children[this.currentTabIndex];
            label.getElementsByTagName('span')[0].textContent = title;
        };

        return Tabs;
    })(HTMLElement);

    module.exports = document.registerElement('cb-tabs', {
        prototype: Tabs.prototype
    });
}).call(this);