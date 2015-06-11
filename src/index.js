var Toolbar = require('./toolbar');
var Editor = require('./editor');
var Logger = require('./logger');
var doc = require('./doc');
var ipc = require('ipc');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');
var path = require('path');

// retrieve current BrowserWindow object
var currentWin = remote.getCurrentWindow();

var appFullName = remote.require('app').getName() + ' ' + remote.require('app').getVersion();
function setWindowTitle(title) {
    if (title === '') {
        currentWin.setTitle(appFullName);
    } else {
        currentWin.setTitle(title + ' - ' + appFullName);
    }
}

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
var cmpStyleRightPane = window.getComputedStyle(rightPane);
var rightPaneBorder = parseInt(cmpStyleRightPane.getPropertyValue('border-left-width'), 10);
var rightPaneMin = parseInt(cmpStyleRightPane.getPropertyValue('min-width'), 10); 

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

        mainPane.style.bottom = (offsetBottom - 1) + 'px';
        logPane.style.height = offsetBottom + 'px';
        editor.editor.resize(); 
    } else if (isResizingRightPane) {
        var offsetRight = container.offsetWidth - 
                            (e.clientX - container.getBoundingClientRect().left);
        
        if (offsetRight < rightPaneMin || container.offsetWidth - offsetRight < leftPaneMin) {
            return;
        }

        leftPane.style.right = (offsetRight + rightPaneBorder) + 'px';
        rightPane.style.width = offsetRight + 'px';
    }
}, false);

var logPaneClose =  document.getElementById('log-header-close');
logPaneClose.onclick = function() {
    currentWin.send('view-event-log');
};

document.addEventListener('mouseup', function (e) {
    isResizingLogPane = false;
    isResizingRightPane = false;
}, false);

// editor
var editor = new Editor(); 
toolbar.btnSave.setClickHandler(editor.save);
ipc.on('file-open', function () {
    var file = dialog.showOpenDialog(
        currentWin, 
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
        setWindowTitle(path.basename(file[0], '.js'));
        fs.readFile(file[0], 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            // strip BOM before sending to the editor
            editor.setContent(data.replace(/^\uFEFF/, ''));
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
ipc.on('edit-cut', function () {
    editor.editor.focus();
    document.execCommand('cut');
});
ipc.on('edit-copy', function () {
    editor.editor.focus();
    document.execCommand('copy'); 
});
ipc.on('edit-paste', function () {
    editor.editor.focus();
    document.execCommand('paste'); 
});
ipc.on('search-find', function () {
    editor.editor.execCommand("find");
});
ipc.on('search-replace', function () {
    editor.editor.execCommand("replace");
});
var mainPaneBottom;
ipc.on('view-event-log', function () {
    if (logPane.style.display == 'none') {
        // if log pane was extended all the way up and user closed the pane and reduced the window 
        // size then we need adjust the offsets to fall within the current size before restoring it
        if (parseInt(mainPaneBottom, 10) >=  container.offsetHeight) {
            mainPane.style.bottom = Math.floor(container.offsetHeight*0.3) + 'px'; // 30% log pane
            logPane.style.height = mainPane.style.bottom;
        } else {
            mainPane.style.bottom = mainPaneBottom;
        }
        logPane.style.display = 'block';
        editor.editor.resize(); 
        currentWin.menu.check('Event Log', true);
    } else {
        mainPaneBottom = mainPane.style.bottom;
        mainPane.style.bottom = '0px';
        logPane.style.display = 'none';
        editor.editor.resize();
        currentWin.menu.check('Event Log', false); 
    }
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
document.getElementById('log-scrollable').appendChild(logger);

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

function clearParamsFile() {
    
    document.getElementById('paramsFilePath').value = '';
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

function clearConfigFile() {
    document.getElementById('configFilePath').value = '';
}

function selectFile(filters) {
    return dialog.showOpenDialog(
        currentWin, 
        { 
            properties: [ 'openFile', 'openFile' ],
            filters: filters
        }
    );
}

function runtimeSettingsSave() {
    runtimeSettings.paramsFilePath = document.getElementById('paramsFilePath').value;
    runtimeSettings.configFilePath = document.getElementById('configFilePath').value;
    
    var iterations = document.getElementById('iterations').value;
    if (iterations !== '') {
        runtimeSettings.iterations = iterations;
    }
    
    var nv = document.getElementById("paramNextValue");
    runtimeSettings.paramNextValue = nv.options[nv.selectedIndex].value;
    
    hideSettings();
}