var Toolbar = require('./toolbar');
var Editor = require('./editor');
var Logger = require('./logger');
var doc = require('./doc');
var ipc = require('ipc');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');

// clicking on any <a href="#"> changes Window title to the value of <title> element. Hence it needs
// to be set to a title we want to show.
var title = document.createElement('title');
title.innerText = remote.require('app').getName() + ' ' + remote.require('app').getVersion();
document.getElementsByTagName('head')[0].appendChild(title);

// toolbar
var toolbar = new Toolbar();
document.body.insertBefore(toolbar, document.body.firstChild);

// panes
var isResizingLogPane = false;
var isResizingRightPane = false;

var container = document.body;
var mainPane = document.getElementById('main-pane');
var logPane = document.getElementById('log-pane');
var leftPane = document.getElementById('left-pane');
var rightPane = document.getElementById('right-pane');
    
var logPaneMin = parseInt(window.getComputedStyle(logPane).getPropertyValue('min-height'), 10);
var mainPaneMin = 100; // cannot use #main-pane min-height because it messes up the Ace editor 
var leftPaneMin = parseInt(window.getComputedStyle(leftPane).getPropertyValue('min-width'), 10);
var rightPaneMin = parseInt(window.getComputedStyle(rightPane).getPropertyValue('min-width'), 10); 

document.getElementById('drag-y').addEventListener('mousedown', function(e){
    isResizingLogPane = true;
}, false);

document.getElementById('drag-x').addEventListener('mousedown', function(e){
    isResizingRightPane = true;
}, false);

document.addEventListener('mousemove', function (e) {
    if (isResizingLogPane) {
        e.preventDefault(); // prevents text selection
        var offsetBottom = container.offsetHeight - 
                            (e.clientY - container.getBoundingClientRect().top);

        if (offsetBottom < logPaneMin || container.offsetHeight - offsetBottom < mainPaneMin) {
            return;
        }

        mainPane.style.bottom = offsetBottom + 'px';
        logPane.style.height= offsetBottom + 'px';
        editor.editor.resize(); 
    } else if (isResizingRightPane) {
        var offsetRight = container.offsetWidth - 
                            (e.clientX - container.getBoundingClientRect().left);
        
        if (offsetRight < rightPaneMin || container.offsetWidth - offsetRight < leftPaneMin) {
            return;
        }

        leftPane.style.right = offsetRight + 'px';
        rightPane.style.width = offsetRight + 'px';
    }
}, false);

document.addEventListener('mouseup', function (e) {
    isResizingLogPane = false;
    isResizingRightPane = false;
}, false);

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
ipc.on('edit-undo', function () {
    editor.undo();
});
ipc.on('edit-redo', function () {
    editor.redo();
});


var paneMain = document.getElementById('left-pane');
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
document.getElementById('log-pane').appendChild(logger);

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