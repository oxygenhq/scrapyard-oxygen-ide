var fs = require('fs');
var rimraf = require('rimraf');
var cp = require('child_process');
var path = require('path');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('rebrand', 'description', function() {
        var cfg = grunt.config.get('rebrand');
        var distPath = path.resolve(__dirname, '..', '..', cfg.dist);
        const electronExe = 'electron';
        const electronExeDarwin = 'Electron';

        if (os.platform() === 'win32') {
            var rceditPath = path.resolve(__dirname, '..', 'utils', 'rcedit.exe');

            // remove unnecessary folders/files
            rimraf.sync(cfg.dist + '/resources/default_app', function(err) {
                if (err) {
                     grunt.fail.fatal(err);
                }
            });

            fs.unlinkSync(path.join(distPath, 'version'));

            // re-brand icon & version
            var child = cp.spawnSync(rceditPath, 
                                    [ path.join(distPath, electronExe + '.exe'), 
                                      '--set-icon', 'resources/app.ico',
                                      '--set-file-version', cfg.version,
                                      '--set-product-version', cfg.version                                              
                                    ]);         
            if (child.error) {
                grunt.fail.fatal(child.error);
            }

            // rename
            fs.renameSync(path.join(distPath, electronExe + '.exe'), 
                            cfg.dist + '/' + cfg.name + '.exe');
        } else if (os.platform() === 'linux') {
            // remove unnecessary folders/files
            rimraf.sync(cfg.dist + '/resources/default_app', function(err) {
                if (err) {
                     grunt.fail.fatal(err);
                }
            });

            fs.unlinkSync(path.join(distPath, 'version'));

            // rename
            fs.renameSync(path.join(distPath, electronExe), 
                            cfg.dist + '/' + cfg.name);
        } else if (os.platform() === 'darwin') {
            // remove unnecessary folders/files
            rimraf.sync(cfg.dist + '/Electron.app/Contents/Resources/default_app', function(err) {
                if (err) {
                     grunt.fail.fatal(err);
                }
            });

            fs.unlinkSync(cfg.dist + '/Electron.app/Contents/Resources/atom.icns');
            fs.unlinkSync(path.join(distPath, 'version'));
            fs.unlinkSync(path.join(distPath, 'LICENSE'));  
            // grunt-contrib-compress fails on broken links, so we remove those
            fs.unlinkSync(cfg.dist + '/Electron.app/Contents/Frameworks/Electron Framework.framework/Frameworks');
            fs.unlinkSync(cfg.dist + '/Electron.app/Contents/Frameworks/Electron Framework.framework/Libraries/Libraries');

            // rename
            fs.renameSync(cfg.dist + '/Electron.app/Contents/MacOS/' + electronExeDarwin, 
                            cfg.dist + '/Electron.app/Contents/MacOS/Oxygen');
                            
            fs.renameSync(cfg.dist + '/Electron.app', 
                            cfg.dist + '/Oxygen.app');
                            
            // update Info.plist
            var plist = '<?xml version="1.0" encoding="UTF-8"?>' +
                        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' +
                        '<plist version="1.0"><dict>' +
                            '<key>CFBundleExecutable</key><string>Oxygen</string>' +
                            '<key>CFBundleIconFile</key><string>app.icns</string>' +
                            '<key>CFBundleIdentifier</key><string>io.cloudbeat.oxygen</string>' +
                            '<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>' +
                            '<key>CFBundleName</key><string>OxygenIDE</string>' +
                            '<key>CFBundlePackageType</key><string>APPL</string>' +
                            '<key>CFBundleVersion</key><string>%VERSION%</string>' +
                            '<key>LSMinimumSystemVersion</key><string>10.8.0</string>' +
                            '<key>NSMainNibFile</key><string>MainMenu</string>' +
                            '<key>NSPrincipalClass</key><string>AtomApplication</string>' +
                            '<key>NSSupportsAutomaticGraphicsSwitching</key>' +
                            '<true/>' +
                        '</dict></plist>';

            fs.writeFileSync(cfg.dist + '/Oxygen.app/Contents/Info.plist', 
                            plist.replace('%VERSION%', cfg.version));
        }
    });
};

