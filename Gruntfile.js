var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-download-electron');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ['download-electron', 'clean', 'copy']);
    grunt.registerTask('release', ['default', 'compress']);

    const OUTDIR = 'build';
    
    var dependencies = [];
    for(var dep in pkg.dependencies) {
        dependencies.push(dep + '/**');
    }

    grunt.initConfig({
        'download-electron': {
            version: '0.25.1',
            outputDir: OUTDIR
        },
        clean: 
            [OUTDIR + "/resources/default_app"],
        copy: {
            main: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'src', src: ['**'], 
                        dest: OUTDIR + '/resources/app' 
                    },
                    { 
                        expand: true, 
                        cwd: 'node_modules', src: dependencies, 
                        dest: OUTDIR + '/resources/app/node_modules' 
                    },
                    { 
                        expand: true, 
                        src: ['package.json', 'LICENSE', 'selenium/**'], 
                        dest: OUTDIR + '/resources/app' 
                    },
                ],
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'cloudbeat-v' + pkg.version + '.zip'
                },
                files: [
                    { expand: true, cwd: OUTDIR, src: ['**'], dest: 'cloudbeat-v' + pkg.version }
                ]
            }
        }
    });
};