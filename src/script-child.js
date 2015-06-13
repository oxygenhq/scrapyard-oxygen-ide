/*
 * Executes user script and controls its execution.
 */
 
var fork = require('child_process').fork;

(function() {
    module.exports = ScriptChild;
    function ScriptChild(scriptFilename, userScriptOffset) {
        const portMin = 1024;
        const portMax = 65535;
        var dbgPort = Math.floor(Math.random() * (portMax - portMin)) + portMin;
        this.scriptFilename = scriptFilename;
        this.userScriptOffset = userScriptOffset;
        
        // fork new process
        var child = this.child = fork(
            scriptFilename, 
            [
                __dirname,   // setting cwd doesn't work (?) so we pass it as an argument
                toolbar.browser,
                runtimeSettings.paramsFilePath,
                runtimeSettings.configFilePath,
                runtimeSettings.iterations,
                runtimeSettings.paramNextValue
            ],
            { execArgv: ['--debug-brk=' + dbgPort] }
        ); 
        
        // apply the breakpoints and request continue
        var Ev = require('events').EventEmitter;
        var Debugger = require('./debugger');
        var dbg = this.dbg = new Debugger(new Ev());

        var self = this;
        
        dbg.connect(dbgPort).then(function(connection) {
            var bps = tabs.currentEditor.getBreakpoints();
            for (var bp of tabs.currentEditor.getBreakpoints()) {
                dbg.request(
                    'setbreakpoint', 
                    { type: 'script', target: scriptFilename, line: userScriptOffset + bp }, 
                    function(err, response) {
                         self.breakPoints[response.line - userScriptOffset] = response.breakpoint;
                    }
                );
            }
            
            dbg.request('continue', null, function(err, response) {
                //console.log('dbg continue:' + JSON.stringify(response));
            });
        });

        dbg.on('change', function() {
            //console.log('dbg change');
        });

        toolbar.btnStart.setClickHandler(function() {
            toolbar.btnStart.disable();
            dbg.request('continue', null, function(err, response) { });
        });
        
        dbg.on('break', function(breakpoint) {
            // continue over the initial breakpoint. line number needs to match the very first code
            // line in the script-boilerplate script.
            if (breakpoint.body.sourceLine == 5) {
                dbg.request('continue', null, function(err, response) {
                });
            }

            tabs.currentEditor.setBpHighlight(breakpoint.body.sourceLine-userScriptOffset);

            // enable Continue button but only if the break is not due to --debug-brk
            if (breakpoint.body.sourceLine >= userScriptOffset) {
                toolbar.btnStart.enable();
            }
        });

        dbg.on('exception', function(exc) {
            //console.log('dbg exception:' + JSON.stringify(exc));
        });

        dbg.on('error', function(err) {
            //console.log('dbg error' + err);
        });
      
        child.on('exit', function (code) {
            if (code === 1) {
                logger.add('ERROR', 'Script terminated abruptly. Possibly due to a syntax error?');
            }
            toolbar.btnStop.disable();
            toolbar.btnStart.enable();
            toolbar.btnStart.setText('Run');
            toolbar.btnStart.setClickHandler(toolbar.start);
            toolbar.btnStop.disable();
            tabs.currentEditor.clearBpHighlight();
            tabs.currentEditor.enable();
        });

        child.on('message', function(m) {
            if (m.event === 'line-update') {
                tabs.currentEditor.setCmdHighlight(m.line - userScriptOffset - 1);
            } else if (m.event === 'log-add') {
                logger.add(m.level, m.msg);
            }
        });
    }
    
    ScriptChild.prototype.breakPoints = {};
    
    /**
     * Terminates script execution.
     */
    ScriptChild.prototype.kill = function() {
        this.dbg.disconnect();
        this.child.kill();
        logger.add('INFO', 'Script terminated.');
    };
    
    /**
     * Adds new breakpoint.
     * @param {Number} Line number where to set the breakpoint.
     */
    ScriptChild.prototype.setBreakpoint = function(line) {
        var self = this;
        this.dbg.request(
            'setbreakpoint', 
            { type: 'script', target: this.scriptFilename, line: this.userScriptOffset + line }, 
            function(err, response) {
                self.breakPoints[line.toString()] = response.breakpoint;
            }
        );
    };
    
    /**
     * Removes existing breakpoint.
     * @param {Number} Line number for which to remove the breakpoint.
     */
    ScriptChild.prototype.clearBreakpoint = function(line) {
        this.dbg.request(
            'clearbreakpoint', 
            { type: 'script', breakpoint: this.breakPoints[line.toString()] }, 
            function(err, response) {}
        );
    };
}).call(this);