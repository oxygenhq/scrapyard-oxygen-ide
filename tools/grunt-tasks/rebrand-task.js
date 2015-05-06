var fs = require('fs');
var rimraf = require('rimraf');
var cp = require('child_process');
var path = require('path');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('rebrand', 'description', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('rebrand');
            const electronExe = 'electron.exe';
            var rceditPath = path.resolve(__dirname, '..', 'utils', 'rcedit.exe');
            var distPath = path.resolve(__dirname, '..', '..', cfg.dist);

            // remove unnecessary folders/files
            rimraf.sync(cfg.dist + '/resources/default_app', function(err) {
                if (err) {
                     grunt.fail.fatal(err);
                }
            });

            fs.unlinkSync(path.join(distPath, 'version'));

            // re-brand icon & version
            var child = cp.spawnSync(rceditPath, 
                                    [ path.join(distPath, electronExe), 
                                      '--set-icon', 'resources/win/app.ico',
                                      '--set-file-version', cfg.version,
                                      '--set-product-version', cfg.version                                              
                                    ]);         
            if (child.error) {
                grunt.fail.fatal(child.error);
            }

            // rename
            fs.renameSync(path.join(distPath, electronExe), 
                            cfg.dist + '/' + cfg.name + '.exe', 
                            function(err) {
                                if (err) {
                                     grunt.fail.fatal(err);
                                }
            });
        }
    });
};

