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
            var btnSave = this.btnSave = new ToolbarButton('tb-save', false, false);
            this.add(btnSave);
            var btnStart = new ToolbarButton('tb-start', false, false, 'Run');
            this.btnStart = btnStart;
            btnStart.onClick = this.start;
            this.add(btnStart);
            var btnStop = this.btnStop = new ToolbarButton('tb-stop', true, false);
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
            this.parentElement.btnStart.setText('Continue');
            editor.disable();

            // inject boilerplate with the user script
            var script = editor.editor.getValue();
            var boilerplate = fs.readFileSync(path.resolve(__dirname, 'script-boilerplate.js'))+'';
            // TODO: should probably optimize this...
            var boilerplateLines = boilerplate.split('\n');
            var userScriptOffset;
            for (var i = 0; i < boilerplateLines.length; i++) {
                if (boilerplateLines[i].indexOf('%%USER_SCRIPT%%') > -1) {
                    userScriptOffset = i - 1;
                    break;
                }
            }
            boilerplate = boilerplate.replace('%%USER_SCRIPT%%', script);

            // and create a tmp file
            var tmpFile = tmp.fileSync();
            fs.writeFile(tmpFile.name, boilerplate, function (err) {
                if (err) throw err;
            });

            var dbgPort = 10001;

            // fork new process
            var scriptChild = this.parentElement.scriptChild = fork(
                tmpFile.name, 
                [ __dirname ],  // setting cwd doesn't work (?) so we pass it as an argument
                { execArgv: ['--debug-brk=' + dbgPort] }
            ); 
            
            // apply the breakpoints and request continue
            var Ev = require('events').EventEmitter;
            var Debugger = require('./debugger');
            var dbg = new Debugger(new Ev());

            dbg.connect(dbgPort).then(function(connection) {
                for (var bp of editor.breakPoints) {
                    dbg.request(
                        'setbreakpoint', 
                        { type: 'script', target: tmpFile.name, line: userScriptOffset + bp }, 
                        function(err, response) {
                            //console.log('dbg setbreakpoint:' + JSON.stringify(response));
                        }
                    );
                }
                
                dbg.request('continue', null, function(err, response) {
                    //console.log('dbg continue:' + JSON.stringify(response));
                });
            });

            dbg.on('change', function() {
                //console.log('dbg change');
            });

            var self = this;
            dbg.on('break', function(breakpoint) {
                //console.log('dbg break:' + JSON.stringify(breakpoint));
                editor.setBpHighlight(breakpoint.body.sourceLine-userScriptOffset);

                self.parentElement.btnStart.onClick = function() {
                    dbg.request('continue', null, function(err, response) {
                    });
                };
                self.parentElement.btnStart.enable();
            });

            dbg.on('exception', function(exc) {
                //console.log('dbg exception:' + JSON.stringify(exc));
            });

            dbg.on('error', function(err) {
                //console.log('dbg error' + err);
            });
          
            scriptChild.on('exit', function () {
                self.parentElement.btnStart.enable();
                self.parentElement.btnStart.setText('Run');
                self.parentElement.btnStart.onClick = self.start;
                self.parentElement.btnStop.disable();
                editor.enable();
            });

            scriptChild.on('message', function(m) {
                if (m.event === 'line-update') {
                    editor.setCmdHighlight(m.line - userScriptOffset - 1);
                } else if (m.event === 'log-add') {
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