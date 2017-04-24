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
    var remote = require('electron').remote;
    var TestRunner = require('./test-runner');
    var Promise = require('bluebird');
    var adb = require('adbkit');
    var adbClient = null;
                
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
            this.modeWeb();
        };

        Toolbar.prototype.detachedCallback = function() {
            this.attached = false;
        };

        Toolbar.prototype.initializeContent = function() {
            
            // new button
            var btnNew = this.btnNew = new ToolbarButton('tb-new', false, false, 'New');
            this.add(btnNew);
            btnNew.setClickHandler(function() { editor.new(); });
            // open button
            var btnOpen = this.btnOpen = new ToolbarButton('tb-open', false, false, 'Open');
            this.add(btnOpen);
            btnOpen.setClickHandler(function() { editor.open(); });
            // save button
            var btnSave = this.btnSave = new ToolbarButton('tb-save', true, false, 'Save');
            this.add(btnSave);
            // separator
            this.add(new ToolbarSeparator());
            // cut button
            var btnCut = this.btnCut = new ToolbarButton('tb-cut', true, false, 'Cut');
            this.add(btnCut);
            btnCut.setClickHandler(function() { remote.getCurrentWindow().send('edit-cut'); });
            // copy button
            var btnCopy = this.btnCopy = new ToolbarButton('tb-copy', true, false, 'Copy');
            this.add(btnCopy);
            btnCopy.setClickHandler(function() { remote.getCurrentWindow().send('edit-copy'); });
            // paste button
            var btnPaste = this.btnPaste = new ToolbarButton('tb-paste', false, false, 'Paste');
            this.add(btnPaste);
            btnPaste.setClickHandler(function() { remote.getCurrentWindow().send('edit-paste'); });
            // separator
            this.add(new ToolbarSeparator());
            // undo button
            var btnUndo = this.btnUndo = new ToolbarButton('tb-undo', true, false, 'Undo');
            this.add(btnUndo);
            btnUndo.setClickHandler(function() { editor.undo(); });
            // redo button
            var btnRedo = this.btnRedo = new ToolbarButton('tb-redo', true, false, 'Redo');
            this.add(btnRedo);
            btnRedo.setClickHandler(function() { editor.redo(); });
            // separator
            this.add(new ToolbarSeparator());
            // web mode button
            var btnModeWeb = this.btnModeWeb = new ToolbarButton('tb-mode-web', false, false);
            this.add(btnModeWeb);
            btnModeWeb.setClickHandler(this.modeWeb);
            // mobile mode button
            var btnModeMob = this.btnModeMob = new ToolbarButton('tb-mode-mob', false, false);
            this.add(btnModeMob);
            btnModeMob.setClickHandler(this.modeMob);
            // browser/device dropdown
            var devSel = document.createElement('select');
            devSel.setAttribute('style', 'float:left;');
            devSel.setAttribute('id', 'devSelect');
            devSel.onchange = function(e) {
                toolbar.targetDevice = e.currentTarget.value;
            };
            this.appendChild(devSel);
            // separator
            this.add(new ToolbarSeparator());
            // run button
            var btnStart = new ToolbarButton('tb-start', false, false, 'Run', 'Run');
            this.btnStart = btnStart;
            this.add(btnStart);
            btnStart.setClickHandler(this.start);
            // stop button
            var btnStop = this.btnStop = new ToolbarButton('tb-stop', true, false, 'Stop');
            this.add(btnStop);
            btnStop.setClickHandler(this.stop);    
            // separator
            this.add(new ToolbarSeparator());
            // settings
            var btnSettings = this.btnSettings = new ToolbarButton('tb-settings', false, false, 'Test Settings');
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
            if (!editor.save()) {
                return;
            }
            logGeneral.clear();
            this.parentElement.btnStart.disable();
            this.parentElement.btnStop.enable();
            this.parentElement.btnStart.setText('Continue');
            editor.disable();
            toolbar.testRunner = new TestRunner(editor.currentFilename);
        };
    
        /**
         * Terminates currently executing script.
         */
        Toolbar.prototype.stop = function() {
            this.parentElement.btnStop.disable();
            logGeneral.add('INFO', 'Stopping...');
            toolbar.testRunner.kill(); 
            this.parentElement.btnStart.setClickHandler(toolbar.start);
            this.parentElement.btnStart.enable();
            this.parentElement.btnStart.setText('Run');
            editor.clearBpHighlight();
            editor.enable();
        };
        
        /**
         * Shows runtime settings modal dialog
         */
        Toolbar.prototype.settings = function() {
            document.getElementById('iterations').value = runtimeSettings.iterations || '1';
            document.getElementById('paramsFilePath').value = runtimeSettings.paramsFilePath || '';
            document.getElementById('paramNextValue').value = runtimeSettings.paramNextValue || 'sequential';
            //document.getElementById('configFilePath').value = runtimeSettings.configFilePath || '';
            document.getElementById('reinitbrowser').checked = runtimeSettings.reinitBrowser || false;
            document.getElementById('reportFolder').value = runtimeSettings.reportFolder || '';
            document.getElementById('reportsTemplateFilePath').value = runtimeSettings.reportsTemplateFilePath || '';
            document.getElementById('modal-settings').className = 
                document.getElementById('modal-settings').className + ' show';
        };
        
        /**
         * Starts/stops the recorder
         */
        Toolbar.prototype.record = function() {
            if (this.recordingActive) {
                this.recorder.stop();
                this.parentElement.btnStart.enable();
                this.recordingActive = false;
                this.parentElement.btnRecord.deactivate('tb-record-red');  
                this.parentElement.btnRecord.activate('tb-record');   
            } else {
                this.parentElement.btnStart.disable();
                this.parentElement.btnStop.disable();
                this.recordingActive = true;
                this.parentElement.btnRecord.deactivate('tb-record');  
                this.parentElement.btnRecord.activate('tb-record-red');  
                this.recorder = new Recorder();
            }
        };
       
        /**
         * Toggles between web & mobile modes
         */
        Toolbar.prototype.modeWeb = function() {
            toolbar.modeMob = false;
            toolbar.btnModeMob.deactivate('selected');  
            toolbar.btnModeWeb.activate('selected');   
            toolbar.populateBrowsers();
        };
        
        Toolbar.prototype.modeMob = function() {
            toolbar.modeMob = true;
            toolbar.btnModeWeb.deactivate('selected');  
            toolbar.btnModeMob.activate('selected');   
            toolbar.populateMobileDevices();
        };
        
        Toolbar.prototype.populateBrowsers = function() {
            var devSel = document.getElementById('devSelect');
            devSel.options.length = 0;

            var browsers = [];
            browsers.push(['Chrome', 'chrome']);
            if (process.platform === 'win32') {
                browsers.push(['Internet Explorer', 'ie']);
            }
            // Selenium's firefox driver doesn't work with latest firefox versions.
            // Need to migrate to Marionette driver.
            //browsers.push(['Firefox', 'firefox']); 
            for (var browser of browsers) {
                var opt = document.createElement('option'); 
                opt.text = browser[0];
                opt.value = browser[1];
                devSel.options.add(opt);
            }
            toolbar.targetDevice = devSel.value;
        };

        Toolbar.prototype.populateMobileDevices = function() {         
            var devSel = document.getElementById('devSelect');
            devSel.options.length = 0;
            
            var deviceList = [];
            if (!adbClient)
                adbClient = adb.createClient();

            adbClient.listDevices()
                .then(function(devices) {
                    return Promise.filter(devices, function(device) {
                        deviceList.push([device.id, device.id]);
                    });
                })
                .then(function() {
                    if (deviceList.length == 0)
                    {
                        logGeneral.add('INFO', 'Device list is empty...');
                        var opt = document.createElement('option'); 
                        opt.text = '- No devices -';
                        opt.value = '';
                        opt.disabled = 'disabled';
                        devSel.options.add(opt);
                    } else {
                        var selectOpt = document.createElement('option'); 
                        selectOpt.text = '- Select Device -';
                        selectOpt.value = '';
                        devSel.options.add(selectOpt);
                        for (var device of deviceList) {
                            var opt = document.createElement('option'); 
                            opt.text = device[0];
                            opt.value = device[1];
                            devSel.options.add(opt);
                        }
                    }
                    toolbar.targetDevice = devSel.value;
                })
                .catch(function(err) {
                    console.error('Something went wrong:', err.stack);
                });            
        };
        
        return Toolbar;
    })(HTMLElement);

    module.exports = document.registerElement('cb-toolbar', {
        prototype: Toolbar.prototype
    });
}).call(this);
