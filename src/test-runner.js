/*
 * Executes user script and controls its execution.
 */
 
(function() {
    module.exports = TestRunner;
    function TestRunner(scriptFilename) {
        const portMin = 1024;
        const portMax = 65535;
        var dbgPort = Math.floor(Math.random() * (portMax - portMin)) + portMin;
        this.scriptFilename = scriptFilename;
        
		// retrieve test settings from the UI
        var browserName = toolbar.browser;
        var paramFilePath = runtimeSettings.paramsFilePath;
        var poFilePath = runtimeSettings.configFilePath;
        var numOfIterations = runtimeSettings.iterations;
        var paramMode = runtimeSettings.paramNextValue;
        var seleniumPort = selSettings.port;
        
        // apply the breakpoints and request continue
        var Ev = require('events').EventEmitter;

        var self = this;
		// mockup test suite object from js fileCreatedDate
		var oxutil = require('oxygen').util;
		var testsuite = oxutil.generateTestSuiteForSingleTestCase(oxutil.generateTestCaseFromJSFile(scriptFilename, paramFilePath, paramMode));
		testsuite.testcases[0].iterationCount = numOfIterations;
        testsuite.testcases[0].ReopenBrowser = runtimeSettings.reinitBrowser;
		
		// prepare module parameters
		var args = [];
		args.push('--web@seleniumUrl=http://localhost:' + seleniumPort + '/wd/hub');
		args.push('--web@browserName=' + browserName);
		args.push('--web@initDriver=true');
        args.push('--web@reopenBrowser=' + (runtimeSettings.reinitBrowser || false));	

		var oxRunner = self.oxRunner = new require('oxygen').Runner();
		oxRunner.on('breakpoint', function(breakpoint, testcase) {
            currentWin.show();
			editor.setBpHighlight(breakpoint.body.sourceLine - oxRunner.getScriptContentLineOffset() + 1);
			toolbar.btnStart.enable();
		});
		oxRunner.on('test-error', function(err) {
			var message = err.message;
			if (err.line)
				message += ' at line ' + err.line;
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
			oxRunner.init(args, dbgPort)
			.then(function() {
				logGeneral.add('INFO', 'Test started...');
                // assign current breakpoints
                testsuite.testcases[0].breakpoints = editor.getBreakpoints();
				return oxRunner.run(testsuite);
			})
			.then(function(tr) {
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
				if (e.line)
					logGeneral.add('ERROR', e.message + ' at line ' + e.line);
				else
					logGeneral.add('ERROR', e.message);
				logGeneral.add('Test failed!');
			});
		}
		catch (e) {console.error(e);}

        toolbar.btnStart.setClickHandler(function() {
            toolbar.btnStart.disable();
            oxRunner.debugContinue();
        });
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