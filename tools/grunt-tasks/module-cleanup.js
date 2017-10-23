var path = require('path');
var modclean = require('modclean');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('module-cleanup', 'Removes unneeded files from node_module', function() {
        var done = this.async();

        var mc = new modclean.ModClean({
            cwd: path.join(process.cwd(), 'node_modules'),
            patterns: ['default:safe'],
            additionalPatterns: ['doc', 'docs', 'documentation', 
                                'coverage', 
                                'browser', 
                                'authors.txt',
                                'gruntfile.js',
                                'quick-test.js', 'build.js',
                                '*.html', '*.htm', '*.png', '*.min.js', '*.map'],
            test: true
        }, function(err, results) {
            if (err) {
                grunt.fail.fatal('Error while cleaning up modules', err);
            }
            
            var syncConfig = grunt.config.get(['sync']);
            var syncSrcs = syncConfig.main.files[1].src;

            for (file of results) {
                if (file) {
                    var isdir = fs.statSync(path.join(process.cwd(), 'node_modules', file)).isDirectory();
                    syncSrcs.push(isdir ? '!' + file + '/**' : '!' + file);
                }
            }
            
            grunt.config.set(['sync'], syncConfig);
            
            done(true);
        });
    });
};

