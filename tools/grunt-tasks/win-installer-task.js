var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('win-installer', 'description', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('win-installer');
            var nsiPath = path.resolve(__dirname, '..', 'installers', 'win', 'oxygen.nsi');

            var child = cp.execFileSync('makensis', 
                                        [ '/DPRODUCT_VERSION='+ cfg.version, 
                                          '/WX', nsiPath],
                                        { stdio : 'inherit'});
        }
    });
};

