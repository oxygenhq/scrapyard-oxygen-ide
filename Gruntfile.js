var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-download-electron');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-msbuild');

    grunt.loadTasks('./tools/grunt-tasks');

    grunt.registerTask('default', ['download-electron', 'msbuild', 'rebrand', 'sync']);
    grunt.registerTask('dev-dist', ['default', 'compress']);
    grunt.registerTask('dist', ['default', 'win-installer']);

    const OUTDIR = 'build';
    
    var dependencies = [];
    for(var dep in pkg.dependencies) {
        if (dep == 'oxygen') {  // don't drag sources into dist. this will be copied separately.
            continue;
        }
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
                        src: ['package.json', 'LICENSE'], 
                        dest: OUTDIR + '/resources/app' 
                    },
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Debug', src: ['*.dll', '*.pdb'], 
                        dest: OUTDIR + '/resources/app/node_modules/oxygen' 
                    },
                ], 
                verbose: true
            }
        },
        compress: {
            main: {
                options: {
                    archive: 'dist/oxygen-v' + pkg.version + '.zip'
                },
                files: [
                    { expand: true, cwd: OUTDIR, src: ['**'], dest: 'oxygen-v' + pkg.version }
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
        },
        msbuild: {
            oxygen: {
                src: ['node_modules/oxygen/Oxygen.csproj'],
                options: {
                    projectConfiguration: 'Debug',
                    targets: ['Clean', 'Rebuild'],
                    version: 12.0,
                    maxCpuCount: 4,
                    buildParameters: {
                        WarningLevel: 2
                    },
                    verbosity: 'minimal'
                }
            },
            ieaddon: {
                src: ['browser-extensions/ie/IEAddon.csproj'],
                options: {
                    projectConfiguration: 'Release',
                    targets: ['Clean', 'Rebuild'],
                    version: 12.0,
                    maxCpuCount: 4,
                    buildParameters: {
                        WarningLevel: 2
                    },
                    verbosity: 'minimal'
                }
            }
        },
        'win-installer': {
          version: pkg.version,
        }
    });
};