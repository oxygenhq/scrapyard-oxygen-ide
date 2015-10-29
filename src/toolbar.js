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
    var ToolbarSeparator = require('./toolbar-separator');
    var Recorder = require('./recorder');
    var fs = require('fs');
    var tmp = require('tmp');
    var path = require('path');
    var remote = require('remote');
    var ScriptChild = require('./script-child');
    var dialog = remote.require('dialog');
                
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
            // new button
            var btnNew = this.btnNew = new ToolbarButton('tb-new', false, false);
            this.add(btnNew);
            btnNew.setClickHandler(function() { editor.new(); });
            // open button
            var btnOpen = this.btnOpen = new ToolbarButton('tb-open', false, false);
            this.add(btnOpen);
            btnOpen.setClickHandler(function() { editor.open(); });
            // save button
            var btnSave = this.btnSave = new ToolbarButton('tb-save', true, false);
            this.add(btnSave);
            // separator
            this.add(new ToolbarSeparator());
            // cut button
            var btnCut = this.btnCut = new ToolbarButton('tb-cut', true, false);
            this.add(btnCut);
            btnCut.setClickHandler(function() { remote.getCurrentWindow().send('edit-cut'); });
            // copy button
            var btnCopy = this.btnCopy = new ToolbarButton('tb-copy', true, false);
            this.add(btnCopy);
            btnCopy.setClickHandler(function() { remote.getCurrentWindow().send('edit-copy'); });
            // paste button
            var btnPaste = this.btnPaste = new ToolbarButton('tb-paste', false, false);
            this.add(btnPaste);
            btnPaste.setClickHandler(function() { remote.getCurrentWindow().send('edit-paste'); });
            // separator
            this.add(new ToolbarSeparator());
            // undo button
            var btnUndo = this.btnUndo = new ToolbarButton('tb-undo', true, false);
            this.add(btnUndo);
            btnUndo.setClickHandler(function() { editor.undo(); });
            // redo button
            var btnRedo = this.btnRedo = new ToolbarButton('tb-redo', true, false);
            this.add(btnRedo);
            btnRedo.setClickHandler(function() { editor.redo(); });
            // separator
            this.add(new ToolbarSeparator());
            // run button
            var btnStart = new ToolbarButton('tb-start', false, false, 'Run');
            this.btnStart = btnStart;
            this.add(btnStart);
            btnStart.setClickHandler(this.start);
            // stop button
            var btnStop = this.btnStop = new ToolbarButton('tb-stop', true, false);
            this.add(btnStop);
            btnStop.setClickHandler(this.stop);            
            // browser dropdown
            var browserSel = document.createElement("select");
            browserSel.setAttribute('style', 'float:left;');
            var browsers = [];
            browsers.push(['Chrome', 'chrome']);
            if (process.platform === 'win32') {
                browsers.push(['Internet Explorer', 'ie']);
            }
            browsers.push(['Firefox', 'firefox']);
            for (var browser of browsers) {
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
            // settings
            var btnSettings = this.btnSettings = new ToolbarButton('tb-settings', false, false);
            this.add(btnSettings);
            btnSettings.setClickHandler(this.settings);
            // record button
            var btnRecord= this.btnRecord = new ToolbarButton('tb-record', false, true);
            this.add(btnRecord);
            btnRecord.setClickHandler(this.record);
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
         * Executes user script.
         */
        Toolbar.prototype.start = function() {       
            logGeneral.clear();
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
            logGeneral.add('INFO', 'Stopping...');
            toolbar.scriptChild.kill(); 
        };
        
        /**
         * Shows runtime settings modal dialog
         */
        Toolbar.prototype.settings = function() {
            document.getElementById('iterations').value = runtimeSettings.iterations || '1';
            document.getElementById('paramsFilePath').value = runtimeSettings.paramsFilePath || '';
            document.getElementById('paramNextValue').value = runtimeSettings.paramNextValue || 'random';
            document.getElementById('configFilePath').value = runtimeSettings.configFilePath || '';
            document.getElementById('modal-settings').className = 
                document.getElementById('modal-settings').className + " show";
        };
        
        /**
         * Starts/stops the recorder
         */
        Toolbar.prototype.record = function() {
            if (this.recordingActive) {
                this.recorder.stop();
                this.parentElement.btnStart.enable();
                this.recordingActive = false;
                this.parentElement.btnRecord.deactivate('tb-record-active');  
            } else {
                this.parentElement.btnStart.disable();
                this.parentElement.btnStop.disable();
                this.recordingActive = true;
                this.parentElement.btnRecord.activate('tb-record-active');
                this.recorder = new Recorder();
            }
        };
        
        return Toolbar;
    })(HTMLElement);

    module.exports = document.registerElement('cb-toolbar', {
        prototype: Toolbar.prototype
    });
}).call(this);
