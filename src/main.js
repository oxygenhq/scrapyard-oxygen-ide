var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var MenuItem = require('menu-item');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

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
    });
  
    var template = [
    {
        label: '&File',
        submenu: [
            {
                label: '&Open',
                accelerator: 'Ctrl+O',
                click: function() { mainWindow.send('file-open'); }
            },
            {
                type: 'separator'
            },
            {
                label: '&Save',
                accelerator: 'Ctrl+S',
                enabled: false,
                click: function() { mainWindow.send('file-save'); }
            },
            {
                label: 'Save As',
                accelerator: 'Alt+Ctrl+S',
                enabled: true,
                click: function() { mainWindow.send('file-save-as'); }
            },
            {
                type: 'separator'
            },
            {
                label: '&Close',
                accelerator: 'Alt+F4',
                click: function() { mainWindow.close(); }
            },
        ]
    },
    {
        label: '[&Dev]',
        submenu: [
            {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: function() { mainWindow.restart(); }
            },
            {
                label: '&Toggle DevTools',
                accelerator: 'Ctrl+D',
                click: function() { mainWindow.toggleDevTools(); }
            },
        ]
    },
    ];

    mainWindow.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(mainWindow.menu);

    mainWindow.menu.saveEnable = function (enabled) {
        for (var item of this.items[0].submenu.items) {
            if (item.label === "&Save") {
                item.enabled = enabled;
            }
        }
    };
});