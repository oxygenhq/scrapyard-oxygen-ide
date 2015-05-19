/*
 * Boilerplate code for user scripts. 
 * Provides everything necessary for executing JS scripts.
 */

var path = require('path');
var cwd = process.argv[2];
var edge = require(path.resolve(cwd, 'node_modules/electron-edge'));
var fs = require('fs');

var multiplexer = edge.func({
    assemblyFile: path.resolve(cwd, 'selenium/Selenium.dll'),
    typeName: 'CloudBeat.Selenium.JSEngine.Engine',
    methodName: 'Invoke'
});

process.send({ event: 'log-add', level: 'INFO', msg: 'Initializing...' });

try { 
    var paramFilePath = (process.argv[4] != 'undefined' ? process.argv[4] : null);
    var configFilePath = (process.argv[5] != 'undefined' ? process.argv[5] : null);
    var paramNextValue = (process.argv[7] != 'undefined' ? process.argv[7] : null);
    multiplexer(
        { 
            module: 'utils', 
            cmd: 'initialize', 
            args: [
                process.argv[3], 
                'http://127.0.0.1:4444/wd/hub', 
                paramFilePath, 
                configFilePath,
                paramNextValue
            ]
        }, 
        true
    ); 
} catch (exc) { 
    process.send({ event: 'log-add', level: 'ERROR', msg: exc.toString() });
    process.exit();
}

web = require(path.resolve(cwd, 'module-web'))(execMethod);
soap = require(path.resolve(cwd, 'module-soap'))(execMethod);
db = require(path.resolve(cwd, 'module-db'))(execMethod);
log = require(path.resolve(cwd, 'module-log'));
assert = require(path.resolve(cwd, 'module-assert'))(execMethod);

Object.defineProperty(global, '__stack', {
    get: function(){
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack){ return stack; };
        var err = new Error();
        Error.captureStackTrace(err, arguments.callee.caller);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function(){
        return __stack[2].getLineNumber();
    }
});

function execMethod(module, cmd, args) {
    process.send({ event: 'line-update', line: __line });
    try { 
        return multiplexer({module: module, cmd: cmd, args: args}, true);
    } catch (exc) { 
   // process.send({ event: 'net-exception', exc: exc.toString() });
    process.send(
    { 
        event: 'log-add', 
        level: 'ERROR', 
        msg: module + '.' + cmd + ': ' + (exc.InnerException||exc).toString() 
    });
    process.exit();
    }
}

process.send({ event: 'log-add', level: 'INFO', msg: 'Executing script...' });
try {
    var iterations = process.argv[6];
    for (i = 0; i < iterations; i++) {
        if (i > 0) {
            process.send({ event: 'log-add', level: 'INFO', msg: 'Starting new iteration.' });
        }
        multiplexer({ module: 'utils', cmd: 'next_iteration', args: [] }, true);
        //%%USER_SCRIPT%%   
    }
} catch (exc) {
    // process.send({ event: 'eval-exception', exc: exc.toString() });
    process.send({ event: 'log-add', level: 'ERROR', msg: JSON.stringify(exc) });
    multiplexer({module: 'utils', cmd: 'close', args: [] }, true); // terminate browser instance
    process.exit();
}

// all done. terminate browser instance and exit.
multiplexer({module: 'utils', cmd: 'close', args: [] }, true);
process.send({ event: 'log-add', level: 'INFO', msg: 'Done.' });
process.exit();