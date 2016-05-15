var Toolbar = require('./toolbar');
var Editor = require('./editor');
var LoggerGeneral = require('./logger-general');
var LoggerSelenium = require('./logger-selenium');
var doc = require('./doc');
var ipc = require('ipc');
var fs = require('fs');
var remote = require('remote');
var dialog = remote.require('dialog');
var path = require('path');
var cp = require('child_process');
var cfg = require('../../config/default.json');
var pkg = require('./package.json');
var selSettings = cfg.selenium;

// tell electron-edge that we are running from within the IDE
process.env.ELECTRON = true;

// retrieve current BrowserWindow object
var currentWin = remote.getCurrentWindow();

// prevent dropping files into the main window
document.ondragover = document.ondrop = function(e) {
    e.preventDefault();
    return false;
};

var appFullName = pkg.productName + ' v' + pkg.version;
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
    editor.open();
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
ipc.on('global-settings', function () {
    if (document.getElementById('modal-global-settings').className.indexOf('show') >= 0) {
        return;
    }
    document.getElementById('chromeBinary').value = require('./settings.json').chrome.binary;
    document.getElementById('modal-global-settings').className = 
        document.getElementById('modal-global-settings').className + " show";
});

var paneMain = document.getElementById('left-pane');
paneMain.appendChild(editor);

// misc menu actions
ipc.on('about', function () {
    var oxygenVer = pkg.dependencies.oxygen.substring(pkg.dependencies.oxygen.indexOf('#') + 1);
    alert(appFullName + '\n\n' +
            'Oxygen: ' + oxygenVer + '\n' +
            'Electron: ' + process.versions.electron + '\n' +
            'Chromium: ' + process.versions.chrome
            ); 
});

// apidoc div
var apiDoc = this.el = document.createElement('div');
apiDoc.setAttribute('id', 'apidoc');
apiDoc.setAttribute('style', 'display:none;');
document.body.appendChild(apiDoc);

// docs
var docs = doc.init();

// general logger
var logGeneral = new LoggerGeneral();
document.getElementById('log-scrollable').appendChild(logGeneral);

// selenium logger
var logSelenium = new LoggerSelenium();
document.getElementById('log-scrollable').appendChild(logSelenium);

document.getElementById('log-header-selenium').addEventListener("change", function() {
    if (this.value == 'general') {
        logGeneral.activate(true);
        logSelenium.activate(false);
    } else {
        logSelenium.activate(true);
        logGeneral.activate(false);
    }
});

// runtime settings modal dialog 
runtimeSettings = { iterations: 1 };

function hideSettings() {
     document.getElementById('modal-settings').className = 
        document.getElementById('modal-settings').className.replace(/\bshow\b/,'');
}

function hideGlobalSettings() {
     document.getElementById('modal-global-settings').className = 
        document.getElementById('modal-global-settings').className.replace(/\bshow\b/,'');
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

function selectChromeBinary() {
    var file = selectFile(
        [
            { name: 'All Files', extensions: ['*'] }
        ]
    );                   
    if (file) {
        document.getElementById('chromeBinary').value = file;
    }
}

function clearConfigFile() {
    document.getElementById('configFilePath').value = '';
}

function clearChromeBinary() {
    document.getElementById('chromeBinary').value = '';
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

function globalSettingsSave() {
    var cfg = require('./settings.json')
    cfg.chrome.binary = document.getElementById('chromeBinary').value;

    fs.writeFile(path.resolve(__dirname, 'settings.json'), 
        JSON.stringify(cfg, null, 2), 
        function (err) {
            if (err) {  
                console.log(err);
                return;
            }
    });

    hideGlobalSettings();
}

// initialize Selenium server
var selArgs = ['-jar', selSettings.jar].concat(selSettings.args);
var chromedriver = (process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver');
selArgs.push('-Dwebdriver.chrome.driver=' + chromedriver);
if (process.platform === 'win32') {
    selArgs.push('-Dwebdriver.ie.driver=IEDriverServer_x86.exe');
}
if (selSettings.port) {
    selArgs.push('-port');
    selArgs.push(selSettings.port.toString()); 
} else {
    selSettings.port = 4444; // set default port if not specified
}

var selProc = cp.spawn('java', selArgs, { cwd: path.resolve(__dirname, selSettings.basePath) });

selProc.stderr.on('data', function (data) {
    logSelenium.add(data.toString().replace(/(?:\r\n|\r|\n)/g, '<br />'));
});        
selProc.stdout.on('data', function(data) {
    logSelenium.add(data.toString().replace(/(?:\r\n|\r|\n)/g, '<br />'));
});
selProc.on('exit', function(code) {
    if (code === 1) {
        logGeneral.add('ERROR', 'Selenium couldn\'t be started. See the Selenium Server log for more details.');
    }
});

// exit cleanups
function exitHandler(options, err) {
    selProc.kill();
}

process.on('exit', exitHandler.bind(null, { cleanup:true }));
process.on('SIGINT', exitHandler.bind(null, { exit:true }));
process.on('uncaughtException', exitHandler.bind(null, { exit:true }));
