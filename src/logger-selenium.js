/*
 * Selenium Server logger component.
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
    
    var LoggerSelenium = (function(_super) {
        __extends(LoggerSelenium, _super);

        const BUFFER_SIZE = 150*1024;
        
        /*
         * Section: Construction and Destruction
         */

        function LoggerSelenium() {
            this.logSize = 0;
        }

        LoggerSelenium.prototype.attached = false;

        LoggerSelenium.prototype.createdCallback = function() {
            this.className += " hidden";
            var div = this.div = document.createElement("div");
            this.appendChild(div);
            this.attached = false;
        };

        LoggerSelenium.prototype.attachedCallback = function() {
            this.attached = true;
        };

        LoggerSelenium.prototype.detachedCallback = function() {
            this.attached = false;
        };
    
        /*
         * Section: Methods
         */
         
        /**
         * Clears the log.
         */
        LoggerSelenium.prototype.clear = function() {
            this.logSize = 0;
            this.div.innerHTML = '';
        };
    
        /**
         * Appends new entry to the log.
         * @param {string} data - Data to append to the log.
         */
        LoggerSelenium.prototype.add = function(data) {
            if (this.logSize > BUFFER_SIZE) {
                this.clear();
            }   
            this.div.innerHTML += data;
            this.logSize += data.length;
        };
    
        /**
         * Actives current log.
         */
        LoggerSelenium.prototype.activate = function(activate) {
            if (activate) {
                this.className = this.className.replace(/\bhidden\b/,'');
            } else {
                this.className += " hidden";
            }
        };

        return LoggerSelenium;
    })(HTMLElement);
  
    module.exports = document.registerElement('cb-logger-sel', {
        prototype: LoggerSelenium.prototype
    });
}).call(this);