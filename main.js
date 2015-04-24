var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var MenuItem = require('menu-item');
var dialog = require('dialog');
var path = require('path');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
var menu = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        width: 800, 
        height: 600, 
        title: app.getName() + ' ' + app.getVersion() 
    });
    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.focus();
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        menu = null;
    });
  
    var template = [
    {
        label: '&File',
        submenu: [
            {
                label: '&Open',
                accelerator: 'Ctrl+O',
                click: function() { openFile(); }
            },
            {
                label: '&Close',
                accelerator: 'Ctrl+W',
                click: function() { mainWindow.close(); }
            },
        ]
    },
    {
        label: '&View',
        submenu: [
            {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: function() { mainWindow.restart(); }
            },
            {
                label: '&Toggle DevTools',
                accelerator: 'Alt+Ctrl+I',
                click: function() { mainWindow.toggleDevTools(); }
            },
        ]
    },
    ];

    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
});

function openFile() {
    var file = dialog.showOpenDialog({ properties: [ 'openFile', 'openFile' ]});
    if (file) {
        mainWindow.send('file-open', file[0]);
    }
}