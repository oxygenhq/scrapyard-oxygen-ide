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
    grunt.loadNpmTasks('grunt-chmod');

    grunt.loadTasks('./tools/grunt-tasks');

    var defaultTasks = [];
    defaultTasks.push('download-electron');
    if (process.platform === 'win32') {
        defaultTasks.push('msbuild:ieaddon');
    }
    defaultTasks.push('rebrand');
    defaultTasks.push('prune-modules');
    defaultTasks.push('sync:main');
    if (process.platform === 'linux') {
        defaultTasks.push('sync:linux');
        // temporary fix before Grunt v0.5 https://github.com/gruntjs/grunt/issues/615
        defaultTasks.push('chmod');
    } else if (process.platform === 'darwin') {
        defaultTasks.push('sync:osx');
        // temporary fix before Grunt v0.5 https://github.com/gruntjs/grunt/issues/615
        defaultTasks.push('chmod');
    } else if (process.platform === 'win32') {
        defaultTasks.push('sync:windows');
    }
    defaultTasks.push('config-patch');

    grunt.registerTask('default', defaultTasks);
    
    if (process.platform === 'linux') {
        grunt.registerTask('dist', ['default', 'compress:linux']);
    } else if (process.platform === 'win32') {
        grunt.registerTask('dist', ['default', 'installer-win']);
    } else if (process.platform === 'darwin') {
        grunt.registerTask('dist', ['default', 'compress:osx']);
    }

    const OUTDIR = 'build';
    const RESOURCES = process.platform === 'darwin' ? 
                        '/Oxygen.app/Contents/Resources' : '/resources';
                        
    var arch = grunt.option('arch') || 'x64';
    if (arch !== 'x64' && arch !== 'ia32') {
        grunt.fail.fatal('Invalid architecture specified. Allowed architectures: x64 and ia32');
    }

    grunt.initConfig({
        'download-electron': {
            version: '1.0.2',
            arch: arch,
            outputDir: OUTDIR,
            rebuild: false
        },
        rebrand: {
            name: pkg.name,
            version: pkg.version,
            dist: OUTDIR,
        },
        'config-patch': {
            dist: OUTDIR
        },
        'prune-modules': {
        },
        clean: 
            [OUTDIR],
        sync: {
            main: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'src', src: ['**', '!config/**', '!oxygen-server/**'], 
                        dest: OUTDIR + RESOURCES + '/app' 
                    },
                    { 
                        expand: true, 
                        cwd: 'node_modules', src: ['**', '.bin/oxygen-server*'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules' 
                    },
                    { 
                        expand: true, 
                        src: ['package.json', 'LICENSE'], 
                        dest: OUTDIR + RESOURCES + '/app' 
                    },
                    { 
                        expand: true, 
                        cwd: 'src', src: ['config/**'], 
                        dest: OUTDIR
                    }
                    /*,
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Release', src: ['*.dll'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules/oxygen' 
                    },*/
                ], 
                verbose: true
            },
            linux: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'resources', src: ['app.png'], 
                        dest: OUTDIR + RESOURCES + '/app'
                    },
                    { 
                        expand: true, 
                        cwd: 'selenium', src: ['*.jar'], 
                        dest: OUTDIR + '/selenium'
                    },
                    { 
                        expand: true, 
                        cwd: 'selenium/lin', src: ['chromedriver'], 
                        dest: OUTDIR + '/selenium'
                    }/*,
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Release', src: ['Oxygen.dll.mdb'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules/oxygen' 
                    }*/
                ], 
                verbose: true
            },
            osx: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'resources', src: ['app.icns'], 
                        dest: OUTDIR + RESOURCES
                    },
                    { 
                        expand: true, 
                        cwd: 'selenium', src: ['*.jar'], 
                        dest: OUTDIR + RESOURCES + '/../selenium'
                    },
                    { 
                        expand: true, 
                        cwd: 'selenium/osx', src: ['chromedriver'], 
                        dest: OUTDIR + RESOURCES + '/../selenium'
                    },
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Release', src: ['Oxygen.dll.mdb'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules/oxygen' 
                    },
                    { 
                        expand: true, 
                        cwd: 'Resources', src: ['Microsoft.VisualBasic.dll'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules/oxygen' 
                    },
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen-server/bin/Release', src: ['**'], 
                        dest: OUTDIR + '/Oxygen.app/Server'
                    },
                    { 
                        expand: true, 
                        cwd: 'Resources', src: ['Microsoft.VisualBasic.dll'], 
                        dest: OUTDIR + '/Oxygen.app/Server'
                    },  
                ], 
                verbose: true
            },
            windows: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'selenium', src: ['*.jar'], 
                        dest: OUTDIR + '/selenium'
                    },
                    { 
                        expand: true, 
                        cwd: 'selenium/win', src: ['*.exe'], 
                        dest: OUTDIR + '/selenium'
                    },
                    { 
                        expand: true, 
                        cwd: 'oxygen-server/win', src: ['node.exe', 'oxygen-server.cmd'], 
                        dest: OUTDIR + '/oxygen-server'
                    }
                    /*,
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Release', src: ['Oxygen.pdb'], 
                        dest: OUTDIR + RESOURCES + '/app/node_modules/oxygen' 
                    }*/
                ], 
                verbose: true
            }
        },
        chmod: {
            options: {
                mode: '775'
            }, 
            'xdg-open': {
                src: [OUTDIR + RESOURCES + '/app/node_modules/opn/xdg-open' ]
            },
            chromedriver: {
                    src: [process.platform === 'linux' ? 
                            OUTDIR + '/selenium/chromedriver' :
                            OUTDIR + RESOURCES + '/../selenium/chromedriver']                    
            }
        },
        compress: {
            linux: {
                options: {
                    archive: 'dist/oxygen-' + pkg.version + '-linux-x64.zip',
                    level: 9
                },
                files: [
                    { 
                        expand: true, 
                        cwd: OUTDIR, src: ['**'], 
                        dest: 'oxygen-' + pkg.version + '-linux-x64'
                    },
                    { 
                        expand: true, 
                        cwd: OUTDIR + '/resources/app/recorder', src: ['CARoot.pem'], 
                        dest: 'oxygen-' + pkg.version + '-linux-x64'
                    }
                ]
            },
            osx: {
                options: {
                    archive: 'dist/oxygen-' + pkg.version + '-osx-x64.zip',
                    level: 9
                },
                files: [
                    { 
                        expand: true, 
                        cwd: OUTDIR, src: ['**'], 
                        dest: 'oxygen-' + pkg.version + '-osx-x64'
                    },                  
                    { 
                        expand: true, 
                        cwd: 'src/recorder', src: ['CARoot.cer'], 
                        dest: 'oxygen-' + pkg.version + '-osx-x64'
                    }
                ]
            }
        },
        watch: {
            scripts: {
                files: ['src/**'],
                tasks: ['jshint', 'sync:main', 'sync:linux']
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
        'installer-win': {
          version: pkg.version,
        }
    });
};
