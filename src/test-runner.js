/*
 * Executes user script and controls its execution.
 */
 
(function() {
    setConfigDirPath();
    module.exports = TestRunner;
    function TestRunner(scriptFilename) {
        const portMin = 1024;
        const portMax = 65535;
        var dbgPort = Math.floor(Math.random() * (portMax - portMin)) + portMin;
        this.scriptFilename = scriptFilename;
        
        // retrieve test settings from the UI
        var browserName = toolbar.targetDevice;
        var modeMobile = toolbar.modeMob;
        var paramFilePath = runtimeSettings.paramsFilePath;
        var numOfIterations = runtimeSettings.iterations;
        var paramMode = runtimeSettings.paramNextValue;
        var seleniumPort = selSettings.port;
  
        var self = this;
        // mockup test suite object from js fileCreatedDate
        var oxutil = require('oxygen').util;
        oxutil.generateTestCaseFromJSFile(scriptFilename, paramFilePath, paramMode)
            .then(function(tc) {
                var testsuite = oxutil.generateTestSuiteForSingleTestCase(tc);
                testsuite.testcases[0].iterationCount = numOfIterations;
                testsuite.testcases[0].ReopenBrowser = runtimeSettings.reinitBrowser;
                
                // prepare launch options
                var options = {};
                options.debugPort = dbgPort;
                options.allowRequire = true;    // allow using require by default
                // prepare module parameters
                var caps = {};
                if (modeMobile) {
                    options.mode = 'mob';
                    caps.deviceName = browserName;
                    caps.deviceOS = 'Android';
                } else {
                    options.mode = 'web';
                    options.seleniumUrl= 'http://localhost:' + seleniumPort + '/wd/hub';
                    options.browserName = browserName;
                    options.initDriver = true;
                    options.reopenBrowser = (runtimeSettings.reinitBrowser || false);
                    options.screenshots = 'never'; // FIXME: this option should be exposed in reports settings
                }       

                var oxRunner = self.oxRunner = new require('oxygen').Runner();
                oxRunner.on('breakpoint', function(breakpoint, testcase) {
                    currentWin.show();
                    editor.setBpHighlight(breakpoint.body.sourceLine - oxRunner.getScriptContentLineOffset() + 1);
                    toolbar.btnStart.enable();
                });
                oxRunner.on('test-error', function(err) {
                    var message = null;
                    if (err.type && err.message) {
                        message = err.type + ' - ' + err.message;
                    } else if (err.type) {
                        message = err.type;
                    } else if (err.message) {
                        message = err.message;
                    }
                    if (err.line) {
                        message += ' at line ' + err.line;
                    }
                    logGeneral.add('ERROR', message);
                });
                oxRunner.on('ui-log-add', function(level, msg) {
                    logGeneral.add(level, msg);
                });
                oxRunner.on('line-update', function(line) {
                    editor.setCmdHighlight(line);
                });
                oxRunner.on('iteration-start', function(i) {
                    logGeneral.add('INFO', 'Starting iteration #' + i);
                });

                // initialize Oxygen
                logGeneral.add('INFO', 'Initializing...');
                try {
                    oxRunner.init(options)
                    .then(function() {
                        logGeneral.add('INFO', 'Test started...');
                        // assign current breakpoints
                        testsuite.testcases[0].breakpoints = editor.getBreakpoints();
                        return oxRunner.run(testsuite, null, caps);
                    })
                    .then(function(tr) {
                        if (runtimeSettings.reportFolder != undefined && runtimeSettings.reportFolder !== '') {
                            logGeneral.add('INFO', 'Generating report...');
                            var ReporterClass = require('oxygen').ReporterXLSX;
                            var reporterOpt = {
                                template: runtimeSettings.reportsTemplateFilePath,
                                targetFolder: runtimeSettings.reportFolder
                            };
                            var reporter = new ReporterClass(tr, reporterOpt);
                            reporter.generate();
                        }

                        logGeneral.add('INFO', 'Test ended');
                        // update UI elements
                        toolbar.btnStop.disable();
                        toolbar.btnStart.enable();
                        toolbar.btnStart.setText('Run');
                        toolbar.btnStart.setClickHandler(toolbar.start);
                        toolbar.btnStop.disable();
                        editor.clearBpHighlight();
                        editor.enable();
                        return oxRunner.dispose();
                    })
                    .catch(function(e) {
                        if (e.line) {
                            logGeneral.add('ERROR', e.message + ' at line ' + e.line);
                        } else {
                            logGeneral.add('ERROR', e.message + '. ' + (e.stack || ''));
                        }
                        logGeneral.add('ERROR', 'Test failed!');
                    });
                } catch (e) {
                    console.error(e);
                }

                toolbar.btnStart.setClickHandler(function() {
                    toolbar.btnStart.disable();
                    oxRunner.debugContinue();
                });
            })
            .catch(function(err) {
                logGeneral.add('ERROR', err.message);
                logGeneral.add('Error executing test!');
            });
    }
    
    function setConfigDirPath() {
        var path = require('path');
        process.env.NODE_CONFIG_DIR = path.join( __dirname, '/node_modules/oxygen/config');
    }
    /**
     * Set breakpoint.
     */
    TestRunner.prototype.setBreakpoint = function(line) {
        this.oxRunner.setBreakpoint(line);
    };
    
    /**
     * Clear breakpoint.
     */
    TestRunner.prototype.clearBreakpoint = function(line) {
        this.oxRunner.clearBreakpoint(line);
    };
    
    /**
     * Terminates script execution.
     */
    TestRunner.prototype.kill = function() {
        this.oxRunner.kill();
        logGeneral.add('INFO', 'Script terminated.');
    };
}).call(this);