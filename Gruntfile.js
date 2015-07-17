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

    var defaultTasks = [];
    defaultTasks.push('download-electron');
    if (process.platform === 'win32') {
        defaultTasks.push('msbuild:ieaddon');
    }
    defaultTasks.push('msbuild:oxygensrv');
    defaultTasks.push('rebrand');
    defaultTasks.push('sync');

    grunt.registerTask('default', defaultTasks);
    grunt.registerTask('dist', ['default', 'installer']);
    grunt.registerTask('dev-dist', ['default', 'compress']);

    const OUTDIR = 'build';
    
    var dependencies = [];
    for(var dep in pkg.dependencies) {
        // don't drag sources into dist. oxygen backend will be copied separately.
        if (dep.indexOf('oxygen') === 0) {
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
                        cwd: 'node_modules/oxygen/bin/Release', src: ['*.dll', '*.pdb'], 
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
           /* no need to build separately since oxygen-server builds it anyway
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
            },*/
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
            },
            oxygensrv: {
                src: ['node_modules/oxygen-server/OxygenServer.csproj'],
                options: {
                    projectConfiguration: 'Release',
                    targets: ['Rebuild'],
                    version: 12.0,
                    maxCpuCount: 4,
                    buildParameters: {
                        WarningLevel: 2
                    },
                    verbosity: 'minimal'
                }
            }
        },
        installer: {
          version: pkg.version,
        }
    });
};
