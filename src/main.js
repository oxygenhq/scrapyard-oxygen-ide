const {app, globalShortcut, BrowserWindow, Menu, MenuItem, ipcMain} = require('electron');
const os = require('os');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
var titlePrefix = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

// Listen for sync message from renderer process
ipcMain.on('window.title:change', (event, title) => {  
    // do not change window title for Windows 7 and below
    if (os.platform() === 'win32' && !isWindows10()) {
        event.sender.send('ignore');
        return;  
    }
    if (mainWindow && titlePrefix) {
        if (title) {
            mainWindow.setTitle(title + ' - ' + titlePrefix);
        }
        else {
            mainWindow.setTitle(titlePrefix);
        }      
        event.sender.send('ok');  
    }
});

app.on('ready', function() {
    titlePrefix = app.getName() + ' ' + app.getVersion();
    var options = {
        width: 860, 
        height: 600, 
        title: app.getName() + ' ' + app.getVersion() 
    };
    if (process.platform === 'linux') {
        options.icon = __dirname + '/app.png';
    }
    mainWindow = new BrowserWindow(options);
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.focus();
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        ipcMain.removeAllListeners('window.title:change');
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
    // prevent native window title updating to that of <title> element when clicking on <a href="#">
    mainWindow.on('page-title-updated', function(e) { e.preventDefault(); });
  
    globalShortcut.register('CommandOrControl+Shift+I', function() { mainWindow.toggleDevTools(); });
  
    var template = [];

    template.push({
        label: '&File',
        submenu: [
            {
                label: '&New',
                accelerator: 'CommandOrControl+N',
                click: function() { mainWindow.send('file-new'); }
            },
            {
                label: '&Open',
                accelerator: 'CommandOrControl+O',
                click: function() { mainWindow.send('file-open'); }
            },
            {
                type: 'separator'
            },
            {
                label: '&Save',
                accelerator: 'CommandOrControl+S',
                enabled: false,
                click: function() { mainWindow.send('file-save'); }
            },
            {
                label: 'Save As',
                accelerator: 'CommandOrControl+Shift+S',
                enabled: true,
                click: function() { mainWindow.send('file-save-as'); }
            },
            {
                type: 'separator'
            },
            {
                label: '&Close',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
                click: function() { mainWindow.close(); }
            },
        ]
    });
    template.push({
        label: 'E&dit',
        submenu: [
            {
                label: '&Undo',
                accelerator: 'CommandOrControl+Z',
                enabled: false,
                click: function() { mainWindow.send('edit-undo'); }
            },
            {
                label: '&Redo',
                accelerator: 'CommandOrControl+Y',
                enabled: false,
                click: function() { mainWindow.send('edit-redo'); }
            },
            {
                type: 'separator'
            },
            {
                label: 'Cu&t',
                accelerator: 'CommandOrControl+X',
                enabled: false,
                click: function() { mainWindow.send('edit-cut'); }
            },
            {
                label: '&Copy',
                accelerator: 'CommandOrControl+C',
                enabled: false,
                click: function() { mainWindow.send('edit-copy'); }
            },
            {
                label: '&Paste',
                accelerator: 'CommandOrControl+V',
                click: function() { mainWindow.send('edit-paste'); }
            },
        ]
    });
    template.push({
        label: '&Search',
        submenu: [
            {
                label: '&Find',
                accelerator: 'CommandOrControl+F',
                click: function() { mainWindow.send('search-find'); }
            },
            {
                label: '&Replace',
                accelerator: 'CommandOrControl+H',
                click: function() { mainWindow.send('search-replace'); }
            }
        ]
    });
    template.push({
        label: '&View',
        submenu: [
            {
                label: '&Event Log',
                accelerator: 'CommandOrControl+Shift+L',
                type: 'checkbox',
                checked: true,
                click: function() { mainWindow.send('view-event-log'); }
            }
        ]
    });
    /*template.push({
        label: '&Settings',
        submenu: [
            {
                label: '&Global Settings',
                click: function() { mainWindow.send('global-settings'); }
            }
        ]
    });*/
    template.push({
        label: '&Help',
        submenu: [
            {
                label: '&Documentation',
                click: function() { require('opn')('http://docs.oxygenhq.org'); }
            },
            {
                type: 'separator'
            },
            {
                label: '&About',
                click: function() { mainWindow.send('about'); }
            },
            {
                label: 'Check for &Updates...',
                click: function() { mainWindow.send('check-updates'); }
            }
        ]
    });
    // show Reload submenu only if OXYGEN_DBG environment variable is defined
    if (process.env.OXYGEN_DBG && process.env.OXYGEN_DBG === 'true') {
        template[template.length-1].submenu.push(
            {
                label: 'Reload',
                accelerator: 'Ctrl+R',
                click: function() { mainWindow.restart(); }
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
    // checks/unchecks menu item
    mainWindow.menu.check = function (submenuLabel, checked) {
        menuItemsMap[submenuLabel].checked = checked;
    };
});

function isWindows10() {
    var release = os.release();
    if (release) {
        var version = release.split('.');
        if (version.length > 0) {
            return true;
        }
    }
    return false;
}