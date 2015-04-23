/*
 * Toolbar component.
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

    var Toolbar;
    var ToolbarButton = require('./toolbar-btn');
    var fs = require('fs');
    var tmp = require('tmp');
    var fork = require('child_process').fork;
    var path = require('path');

    Toolbar = (function(_super) {
        __extends(Toolbar, _super);

        /*
         * Section: Construction and Destruction
         */
         
        function Toolbar() {
        }
        
        Toolbar.prototype.attached = false;

        Toolbar.prototype.createdCallback = function() {
            this.attached = false;
            this.initializeContent();
        };

        Toolbar.prototype.attachedCallback = function() {
          this.attached = true;
        };

        Toolbar.prototype.detachedCallback = function() {
          return this.attached = false;
        };

        Toolbar.prototype.initializeContent = function() {
            var btnSave = this.btnSave = new ToolbarButton('tb-save');
            this.add(btnSave);
            var btnStart = new ToolbarButton('tb-start');
            this.btnStart = btnStart;
            btnStart.onClick = this.start;
            this.add(btnStart);
            var btnStop = this.btnStop = new ToolbarButton('tb-stop', true);
            btnStop.onClick = this.stop;
            this.add(btnStop);
        };
    
        /*
         * Section: Methods
         */
        
        /**
         * Adds new child component to this component.
         * TODO: define base type for inner elements.
         * @param {object} component - Component with an exposed createComponent() returning HTMLElement to be added to this component.
         */
        Toolbar.prototype.add = function(component) {
            this.appendChild(component.createComponent());
        }
    
        /**
         * Executes user script.
         */
        Toolbar.prototype.start = function() {
            logger.clear();
            this.parentElement.btnStart.disable();
            this.parentElement.btnStop.enable();

            // create temp file 
            var script = editor.editor.getValue();
            var tmpFile = tmp.fileSync();
            fs.writeFile(tmpFile.name, script, function (err) {
                logger.add("err", err);
                if (err) throw err;
                
            });

            // fork the process. FIXME: debugger not working. see atom-shell PRs for a patch.
            var scriptChild = this.parentElement.scriptChild = fork(
                path.resolve(__dirname, 'script-boilerplate.js'), 
                [ tmpFile.name ], 
                { execArgv: ['--debug-brk=10000'] }   // --debug-brk=11000 to break on first line
            ); 
          
            var self = this;
            scriptChild.on('exit', function () {
                self.parentElement.btnStart.enable();
                self.parentElement.btnStop.disable();
            });

            scriptChild.on('message', function(m) {
                if (m.event === 'line-update') {
                    editor.setCmdHighlight(m.line);
                } /*else if (m.event === 'eval-exception') {
                    logger.add('ERROR', m.exc);
                    alert('Oops! Something went wrong. Please see the log.');
                } else if (m.event === 'net-exception') {
                    logger.add('ERROR', m.exc);
                    alert('Oops! Something went wrong. Please see the log.');
                }*/ else if (m.event === 'log-add') {
                    logger.add(m.level, m.msg);
                }
            });
        };
    
        /**
         * Terminates currently executing script.
         */
        Toolbar.prototype.stop = function() {
            this.parentElement.btnStart.enable();
            this.parentElement.btnStop.disable();
            this.parentElement.scriptChild.kill(); 
        };

        return Toolbar;
    })(HTMLElement);

    module.exports = Toolbar = document.registerElement('cb-toolbar', {
        prototype: Toolbar.prototype
    });
}).call(this);