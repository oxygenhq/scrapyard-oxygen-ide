var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-download-electron');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadTasks('./tools/grunt-tasks');

    grunt.registerTask('default', ['download-electron', 'rebrand', 'sync']);
    grunt.registerTask('release', ['default', 'compress']);

    const OUTDIR = 'build';
    
    var dependencies = [];
    for(var dep in pkg.dependencies) {
        dependencies.push(dep + '/**');
    }

    grunt.initConfig({
        'download-electron': {
            version: '0.26.1',
            outputDir: OUTDIR,
            rebuild: false
        },
        rebrand: {
            name: pkg.name,
            version: pkg.version,
            dist: OUTDIR,
        },
        clean: 
            [OUTDIR],
        sync: {
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
                verbose: true
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
        },
        watch: {
            scripts: {
                files: ['src/**'],
                tasks: ['jshint', 'sync']
            },
        },
        jshint: {
            files: ['Gruntfile.js', 'src/*.js', 'src/recorder/*.js', 
                    '!src/recorder/wgxpath.install.js', '!src/jquery.min.js'],
                options: {
                    esnext: true,
                    curly: false,
                    loopfunc: true,
                    shadow: true
                }
        }
    });
};