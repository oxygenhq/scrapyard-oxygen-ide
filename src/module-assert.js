module.exports = function(execMethod) {
    var module = {};
    module.equal = function() { return execMethod('assert', 'equal', Array.prototype.slice.call(arguments)); };
    module.notEqual = function() { return execMethod('assert', 'notEqual', Array.prototype.slice.call(arguments)); };
    module.fail = function() { return execMethod('assert', 'fail', Array.prototype.slice.call(arguments)); };
    return module;
};