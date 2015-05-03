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

try { 
    multiplexer({ module: 'utils', cmd: 'initialize', 
                    args: [process.argv[3], 'http://127.0.0.1:4444/wd/hub'] }, true); 
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
        var err = new Error;
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
    process.send({ event: 'log-add', level: 'ERROR', msg: cmd + (exc.InnerException||exc).toString() });
    process.exit();
    }
}

try {
%%USER_SCRIPT%%
} catch (exc) {
    // process.send({ event: 'eval-exception', exc: exc.toString() });
    process.send({ event: 'log-add', level: 'ERROR', msg: JSON.stringify(exc) });
    multiplexer({module: 'utils', cmd: 'close', args: [] }, true); // terminate browser instance
    process.exit();
}

// all done. terminate browser instance and exit.
multiplexer({module: 'utils', cmd: 'close', args: [] }, true);
process.exit();