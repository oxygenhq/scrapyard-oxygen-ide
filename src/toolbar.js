/*
 * Toolbar component.
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

    var ToolbarButton = require('./toolbar-btn');
    var Recorder = require('./recorder');
    var fs = require('fs');
    var tmp = require('tmp');
    var path = require('path');
    var remote = require('remote');
    var ScriptChild = require('./script-child');
                
    var Toolbar = (function(_super) {
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
            this.attached = false;
        };

        Toolbar.prototype.initializeContent = function() {
            // save button
            var btnSave = this.btnSave = new ToolbarButton('tb-save', true, false);
            btnSave.onClick = this.save;
            this.add(btnSave);
            // run button
            var btnStart = new ToolbarButton('tb-start', false, false, 'Run');
            this.btnStart = btnStart;
            btnStart.onClick = this.start;
            this.add(btnStart);
            // stop button
            var btnStop = this.btnStop = new ToolbarButton('tb-stop', true, false);
            btnStop.onClick = this.stop;
            this.add(btnStop);       
            // browser dropdown
            var browserSel = document.createElement("select");
            for (var browser of [['Chrome', 'chrome'], 
                                ['Internet Explorer', 'ie'], 
                                ['Firefox', 'firefox']]) {
                var opt = document.createElement("option"); 
                opt.text = browser[0];
                opt.value = browser[1];
                browserSel.options.add(opt);
            }
            this.browser = browserSel.value;
            var self = this;
            browserSel.onchange = function(e) {
                self.browser = e.currentTarget.value;
            };
            this.appendChild(browserSel);
            // record button
            var btnRecord= this.btnRecord = new ToolbarButton('tb-camera', false, true);
            btnRecord.onClick = this.record;
            this.add(btnRecord);
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
        };
    
        /**
         * Saves the script.
         */
        Toolbar.prototype.save = function() {
            if (editor.currentFilename) {
                fs.writeFile(editor.currentFilename, editor.getContent(), function(err) {
                    if(!err) {
                        toolbar.btnSave.disable();
                    }
                }); 
            } else {
                editor.currentFilename = remote.require('dialog').showSaveDialog();
                if (editor.currentFilename) {
                   fs.writeFile(editor.currentFilename, editor.getContent(), function(err) {
                        if(!err) {
                            toolbar.btnSave.disable();
                        }
                    }); 
                }
            }
        };

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
            var script = editor.getContent();
            var boilerplate = fs.readFileSync(path.resolve(__dirname, 'script-boilerplate.js'))+'';
            // TODO: should probably optimize this...
            var boilerplateLines = boilerplate.split('\n');
            var userScriptOffset;
            for (var i = 0; i < boilerplateLines.length; i++) {
                if (boilerplateLines[i].indexOf('//%%USER_SCRIPT%%') > -1) {
                    userScriptOffset = i - 1;
                    break;
                }
            }
            boilerplate = boilerplate.replace('//%%USER_SCRIPT%%', script);

            // and create a tmp file
            var tmpFile = tmp.fileSync();
            fs.writeFile(tmpFile.name, boilerplate, function (err) {
                if (err) throw err;
            });

            toolbar.scriptChild = new ScriptChild(tmpFile.name, userScriptOffset);
        };
    
        /**
         * Terminates currently executing script.
         */
        Toolbar.prototype.stop = function() {
            toolbar.scriptChild.kill(); 
        };
        
        /**
         * Starts/stops the recorder
         */
        Toolbar.prototype.record = function() {
            if (this.recordingActive) {
                this.recorder.stop();
                this.parentElement.btnStart.enable();
                this.recordingActive = false;
                this.parentElement.btnRecord.deactivate('tb-camera-active');  
            } else {
                this.parentElement.btnStart.disable();
                this.parentElement.btnStop.disable();
                this.recordingActive = true;
                this.parentElement.btnRecord.activate('tb-camera-active');
                this.recorder = new Recorder();
            }
        };
        
        return Toolbar;
    })(HTMLElement);

    module.exports = document.registerElement('cb-toolbar', {
        prototype: Toolbar.prototype
    });
}).call(this);