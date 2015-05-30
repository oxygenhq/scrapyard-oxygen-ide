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
  
    var template = [];

    template.push({
        label: '&File',
        submenu: [
            {
                label: '&New',
                accelerator: 'Ctrl+N',
                click: function() { mainWindow.send('file-new'); }
            },
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
    });
    template.push({
        label: '&Edit',
        submenu: [
            {
                label: '&Undo',
                accelerator: 'Ctrl+Z',
                enabled: false,
                click: function() { mainWindow.send('edit-undo'); }
            },
            {
                label: '&Redo',
                accelerator: 'Ctrl+Y',
                enabled: false,
                click: function() { mainWindow.send('edit-redo'); }
            },
            {
                type: 'separator'
            },
            {
                label: 'Cu&t',
                accelerator: 'Ctrl+X',
                enabled: false,
                click: function() { mainWindow.send('edit-cut'); }
            },
            {
                label: '&Copy',
                accelerator: 'Ctrl+C',
                enabled: false,
                click: function() { mainWindow.send('edit-copy'); }
            },
            {
                label: '&Paste',
                accelerator: 'Ctrl+V',
                click: function() { mainWindow.send('edit-paste'); }
            },
        ]
    });
    
    // show debug menu only if CLOUDBEAT_DBG environment variable is defined
    if (process.env.CLOUDBEAT_DBG && process.env.CLOUDBEAT_DBG === 'true') {
        template.push({
            label: '[Dev]',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'Ctrl+R',
                    click: function() { mainWindow.restart(); }
                },
                {
                    label: 'Toggle DevTools',
                    accelerator: 'Ctrl+D',
                    click: function() { mainWindow.toggleDevTools(); }
                },
            ]
        });
    }

    mainWindow.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(mainWindow.menu);

    // generate menu items map so we can easily enable/disable them later on
    var menuItemsMap = [];
    for (var topItems of mainWindow.menu.items) {
        for (var subItem of topItems.submenu.items) {
            menuItemsMap[subItem.label.replace('&', '')] = subItem;
        }
    }
    // enables/disable menu item
    mainWindow.menu.enable = function (submenuLabel, enabled) {
        menuItemsMap[submenuLabel].enabled = enabled;
    };
});