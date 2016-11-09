var cp = require('child_process');
var path = require('path');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('installer-win', 'Creates setup package for the Windows platform.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('installer-win');
            var nsiPath = path.resolve(__dirname, '..', 'installers', 'win', 'oxygen.nsi');

            var child = cp.execFileSync('makensis', 
                                        [ '/DPRODUCT_VERSION=' + cfg.version, 
                                          '/DPRODUCT_ARCH=' + cfg.arch,
                                          '/WX', nsiPath],
                                        { stdio : 'inherit'});
        }
    });
};

