/*
 * V8 debugger client.
 */ 

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');
var Protocol = require('_debugger').Protocol;

inherits(Debugger, EventEmitter);
function Debugger() {
    this.reqCallbacks = [];
}

/**
 * Connects to a debugger. Does nothing if already connected.
 * @param {Integer} Debugger port.
 */
Debugger.prototype.connect = function(port) {
    var socket;
    var self = this;
    var protocol = new Protocol();

    self.reqCallbacks = [];
    self.connectTimes = self.connectTimes || 0;
    self.protocol = protocol;
    if (this.connected && this.port === port) {
        return;
    }

    socket = net.connect({ port: port });
    this.port = port;
    self.socket = socket;
    self.socket.setEncoding('utf8');
    self.socket.on('connect', function() {
        self.connectTimes = 0;
        self.connected = true;
    });
    self.socket.on('error', function(err) {
        self.connected = false;
        self.socket = null;
        self.connectTimes += 1;

        if (self.connectTimes === 10) {
            self.emit('error', err);
        }

        setTimeout(function() {
            self.connect(port);
        }, 500);
    });
    self.socket.on('data', function(d) {
        self.protocol.execute(d);
    });

    protocol.onResponse = processResponse.bind(this);
    
    function processResponse(res) {
        var cb, index = -1;

        this.reqCallbacks.some(function(fn, i) {
            if (fn.request_seq == res.body.request_seq) {
                cb = fn;
                index = i;
                return true;
            }
        });

        var handled = false;
        if (res.headers.Type == 'connect') {
            this.emit('connected');
            handled = true;
        } else if (res.body && res.body.event == 'break') {
            this.emit('break', res.body);
            handled = true;
        } else if (res.body && res.body.event == 'exception') {
            this.emit('exception', res.body);
            handled = true;
        } else if (res.body && res.body.event == 'afterCompile') {
            this.emit('afterCompile', res.body.body.script);
            handled = true;
        } 

        if (cb) {
            this.reqCallbacks.splice(index, 1);
            handled = true;

            var err = res.success === false && (res.message || true) ||
                      res.body.success === false && (res.body.message || true);
            cb(err, res.body && res.body.body || res.body, res);
        }

        if (!handled) {
            this.emit('unhandledResponse', res.body);
        }
    }
};

/**
 * Sends a request.
 * @param {String} The command.
 * @param {Object} Command arguments.
 * @param {Function} Callback function(err, result)
 */
Debugger.prototype.request = function(command, args, cb) {
    var req = {
        command: command,
        type: 'request'
    };

    if (args) {
        req.arguments = args;
    }

    if (!this.socket) {
        return;
    }

    this.socket.write(this.protocol.serialize(req));
    cb.request_seq = req.seq;
    this.reqCallbacks.push(cb);
};

/**
 * Disconnects from the debugger
 * @param {Function} Callback function(err, response)
 */
Debugger.prototype.disconnect = function(cb) {
    this.request('disconnect', {}, cb);
    this.socket = null;
    this.connected = false;
    this.emit('disconnected');
};

module.exports = Debugger;