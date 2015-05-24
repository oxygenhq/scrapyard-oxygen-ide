var Toolbar = require('./toolbar');
var Editor = require('./editor');
var Logger = require('./logger');
var doc = require('./doc');
var ipc = require('ipc');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');

document.onkeydown = function(evt) {
    if (evt.keyCode == 8) {     // cancel backspace to prevent 'Back' action
        event.preventDefault();
    }
};

// toolbar
var toolbar = new Toolbar();
document.body.insertBefore(toolbar, document.body.firstChild);

// layout
$("#hLayout").splitter({ type: "h", anchorToWindow: true, sizeBottom: true });

// editor
var editor = new Editor(); 
toolbar.btnSave.setClickHandler(editor.save);
ipc.on('file-open', function () {
    var file = dialog.showOpenDialog(
        remote.getCurrentWindow(), 
        { 
            properties: [ 'openFile', 'openFile' ],
            filters: 
            [
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        }
    );
    if (file) {
        editor.currentFilename = file[0];
        fs.readFile(file[0], 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            editor.setContent(data);
            toolbar.btnSave.disable();
        });
    }
});
ipc.on('file-save', function () {
    editor.save();
});
ipc.on('file-save-as', function () {
    editor.saveAs();
});
ipc.on('file-new', function () {
    editor.new();
});


$('#paneMain').bind('splitresize', function(){
    editor.editor.resize(); 
}); 
var paneMain = document.getElementById('paneMain');
paneMain.appendChild(editor);

// apidoc div
var apiDoc = this.el = document.createElement('div');
apiDoc.setAttribute('id', 'apidoc');
apiDoc.setAttribute('style', 'display:none;');
document.body.appendChild(apiDoc);

// docs
var docs = doc.init();

// logger
var logger = new Logger();
document.getElementById('paneLog').appendChild(logger);

// runtime settings modal dialog 
runtimeSettings = { iterations: 1 };

function hideSettings() {
     document.getElementById('modal-settings').className = 
        document.getElementById('modal-settings').className.replace(/\bshow\b/,'');
}

function selectParamsFile() {
    var file = selectFile(
        [
            { name: 'CSV', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    );                   
    if (file) {
        document.getElementById('paramsFilePath').value = file;
    }
}

function selectConfigFile() {
    var file = selectFile(
        [
            { name: 'Test Case Config', extensions: ['config'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    );                   
    if (file) {
        document.getElementById('configFilePath').value = file;
    }
}

function selectFile(filters) {
    return dialog.showOpenDialog(
        remote.getCurrentWindow(), 
        { 
            properties: [ 'openFile', 'openFile' ],
            filters: filters
        }
    );
}

function runtimeSettingsSave() {
    var paramsFilePath = document.getElementById('paramsFilePath').value;
    if (paramsFilePath !== '') {
        runtimeSettings.paramsFilePath = paramsFilePath;
    }
    
    var configFilePath = document.getElementById('configFilePath').value;
    if (configFilePath !== '') {
        runtimeSettings.configFilePath = configFilePath;
    }
    
    var iterations = document.getElementById('iterations').value;
    if (iterations !== '') {
        runtimeSettings.iterations = iterations;
    }
    
    var nv = document.getElementById("paramNextValue");
    runtimeSettings.paramNextValue = nv.options[nv.selectedIndex].value;
    
    hideSettings();
}