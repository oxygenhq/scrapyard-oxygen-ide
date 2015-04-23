/*
 * Logger component.
 */ 

(function() {
    var __hasProp = {}.hasOwnProperty;
    var __extends = function(child,  parent) {  
        for(var key in parent) { 
            if (__hasProp.call(parent,  key)) child[key] = parent[key]; 
        } 
        function ctor() { 
            this.constructor = child; 
        } 
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;  
        return child;  
    };
    
    var Logger;

    Logger = (function(_super) {
        __extends(Logger, _super);

        /*
         * Section: Construction and Destruction
         */
         
        function Logger() {
        }

        Logger.prototype.attached = false;

        Logger.prototype.createdCallback = function() {
          this.attached = false;
        };

        Logger.prototype.attachedCallback = function() {
          this.attached = true;
        };

        Logger.prototype.detachedCallback = function() {
          return this.attached = false;
        };
    
        /*
         * Section: Methods
         */
         
        /**
         * Clears the log.
         */
        Logger.prototype.clear = function() {
          this.innerHTML = '';
        };
    
        /**
         * Appends new entry to the log.
         * @param {string} level - Log level. Can be a custom string or one of the predefined levels: 'INFO', 'ERROR', 'WARN', 'DEBUG', 'FATAL'.
         * @param {string} msg - Message to log.
         * @param {string|undefined} date - Optional log date. If not specified current time will be used.
         */
        Logger.prototype.add = function(level, msg, date) {
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
    
        /*
         * Section: Global helpers
         */
         
        Object.defineProperty(global, '__timeNow', {
            get: function(){
                return (new Date()).toLocaleTimeString();
            }
        });

        return Logger;
    })(HTMLElement);
  
    module.exports = Logger = document.registerElement('cb-logger', {
        prototype: Logger.prototype,
        extends: 'table'
    });
}).call(this);