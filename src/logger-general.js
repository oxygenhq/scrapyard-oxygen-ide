/*
 * General logger component.
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
    
    var LoggerGeneral = (function(_super) {
        __extends(LoggerGeneral, _super);

        /*
         * Section: Construction and Destruction
         */

        function LoggerGeneral() {
        }

        LoggerGeneral.prototype.attached = false;

        LoggerGeneral.prototype.createdCallback = function() { 
            this.attached = false;
        };

        LoggerGeneral.prototype.attachedCallback = function() {
            this.attached = true;
        };

        LoggerGeneral.prototype.detachedCallback = function() {
            this.attached = false;
        };
    
        /*
         * Section: Methods
         */
         
        /**
         * Clears the log.
         */
        LoggerGeneral.prototype.clear = function() {
            this.innerHTML = '';
        };
    
        /**
         * Appends new entry to the log.
         * @param {string} level - Log level. Can be a custom string or one of the predefined levels: 'INFO', 'ERROR', 'WARN', 'DEBUG', 'FATAL'.
         * @param {string} msg - Message to log.
         * @param {string|undefined} date - Optional log date. If not specified current time will be used.
         */
        LoggerGeneral.prototype.add = function(level, msg, date) {
            date = date || __timeNow;
            var row = document.createElement('tr');
            var dateCol = document.createElement('td');
            dateCol.className = 'date';
            var levelCol = document.createElement('td');
            levelCol.className = 'level';
            if (level === 'ERROR') {
                levelCol.className += ' level-error';
            }
            var msgCol = document.createElement('td');  
            dateCol.appendChild(document.createTextNode(date));
            levelCol.appendChild(document.createTextNode(level));
            msgCol.appendChild(document.createTextNode(msg));     
            row.appendChild(dateCol);
            row.appendChild(levelCol);
            row.appendChild(msgCol);
            this.appendChild(row);
        };
    
        /**
         * Actives current log.
         */
        LoggerGeneral.prototype.activate = function(activate) {
            if (activate) {
                this.className = this.className.replace(/\bhidden\b/,'');
            } else {
                this.className += " hidden";
            }
        };

        /*
         * Section: Global helpers
         */
         
        Object.defineProperty(global, '__timeNow', {
            get: function(){
                return (new Date()).toLocaleTimeString();
            }
        });

        return LoggerGeneral;
    })(HTMLElement);
  
    module.exports = document.registerElement('cb-logger-gen', {
        prototype: LoggerGeneral.prototype,
        extends: 'table'
    });
}).call(this);