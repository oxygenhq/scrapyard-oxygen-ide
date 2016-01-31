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
        //__dirname
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
		var bps = editor.getBreakpoints();
		testsuite.testcases[0].breakpoints = bps;
		testsuite.testcases[0].iterationCount = numOfIterations;
		
		// prepare module parameters
		var args = [];
		args.push('--web@seleniumUrl=http://localhost:' + seleniumPort + '/wd/hub');
		args.push('--web@browserName=' + browserName);
		args.push('--web@initDriver=true');

		var oxRunner = self.oxRunner = new require('oxygen').Runner();
		// hook to various Oxygen events
		oxRunner.on('initialized', function() {
			try {
			self.oxRunner.run(testsuite);
			}
			catch (e) {console.error(e);}
		});
		oxRunner.on('test-ended', function(tr) {
			//saveTestResults(tr);
			oxRunner.dispose();
			// update UI elements
			toolbar.btnStop.disable();
            toolbar.btnStart.enable();
            toolbar.btnStart.setText('Run');
            toolbar.btnStart.setClickHandler(toolbar.start);
            toolbar.btnStop.disable();
            editor.clearBpHighlight();
            editor.enable();
			// TODO handle errors
			//logGeneral.add('ERROR', 'Script terminated abruptly. Possibly due to a syntax error?');
		});
		oxRunner.on('test-error', function(e) {
			//console.error(e);
			if (e.line)
				logGeneral.add('ERROR', e.message + ' at line ' + e.line);
			else
				logGeneral.add('ERROR', e.message);
		});
		oxRunner.on('breakpoint', function(breakpoint, testcase) {
			if (breakpoint.body.sourceLine == 1)
			{
				oxRunner.debugContinue();
				return;
			}
			console.dir(breakpoint);
			editor.setBpHighlight(breakpoint.body.sourceLine);
			toolbar.btnStart.enable();
		});
		oxRunner.on('disposed', function() {
		});
		// initialize Oxygen
		try {
		oxRunner.init(args, dbgPort);
		}
		catch (e) {console.error(e);}

        toolbar.btnStart.setClickHandler(function() {
            toolbar.btnStart.disable();
            oxRunner.debugContinue();
        });
              
        /*child.on('message', function(m) {
            if (m.event === 'line-update') {
                editor.setCmdHighlight(m.line - userScriptOffset - 1);
            } else if (m.event === 'log-add') {
                logGeneral.add(m.level, m.msg);
            }
        });*/
		
    }
    
    /**
     * Terminates script execution.
     */
    TestRunner.prototype.kill = function() {
        this.oxRunner.kill();
        logGeneral.add('INFO', 'Script terminated.');
    };
    
}).call(this);