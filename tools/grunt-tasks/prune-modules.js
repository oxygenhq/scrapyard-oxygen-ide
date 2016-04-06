var cp = require('child_process');
var path = require('path');

module.exports = function(grunt) {
    grunt.registerTask('prune-modules', 'description', function() {
        cp.execSync('npm3 prune --production', 
                    { maxBuffer: 1024 * 1024 },
                    function(error, stdout, stderr) {
                        if (error) {
                            process.exit(error.code || 1);
                        }
                    });
    });
};

