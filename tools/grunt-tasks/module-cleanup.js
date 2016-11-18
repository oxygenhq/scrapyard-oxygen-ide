var path = require('path');
var modclean = require('modclean');

module.exports = function(grunt) {
    grunt.registerTask('module-cleanup', 'Removes unneeded files from node_module', function() {
        var done = this.async();

        var mc = new modclean.ModClean({
            cwd: path.join(process.cwd(), 'node_modules'),
            patterns: [modclean.patterns.safe, 
                        'doc', 'docs', 'documentation', 
                        'coverage', 
                        'browser', 
                        '*.html', '*.htm', '*.png', '*.min.js', '*.map'],
            test: false
        }, function(err, results) {
            if (err) {
                grunt.fail.fatal('Error while cleaning up modules', err);
            }

            for (file of results) {
                grunt.log.writeln((mc.options.test ? '[TEST] Deleted' : 'Deleted'), file);
            }

            done(true);
        });
    });
};

