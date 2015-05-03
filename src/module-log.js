/**
 * Collection of methods for sending messages to the Log window.
 */
module.exports = {
    /**
     * Print an INFO message to the log window.
     * @function info
     * @param {String} msg - Message to print.
     */
    info: function(msg) { _log('INFO', msg); },  
    /**
     * Print an ERROR message to the log window.
     * @function error
     * @param {String} msg - Message to print.
     */
    error: function(msg) { _log('ERROR', msg); },  
    /**
     * Print an DEBUG message to the log window.
     * @function debug
     * @param {String} msg - Message to print.
     */
    debug: function(msg) { _log('DEBUG', msg); },  
    /**
     * Print an WARN message to the log window.
     * @function warn
     * @param {String} msg - Message to print.
     */
    warn: function(msg) { _log('WARN', msg); },  
    /**
     * Print an FATAL message to the log window.
     * @function fatal
     * @param {String} msg - Message to print.
     */
    fatal: function(msg) { _log('FATAL', msg); }
};

function _log(level, msg) {
    process.send({ event: 'line-update', line: __line });
    process.send({ event: 'log-add', level: level, msg: msg });
}