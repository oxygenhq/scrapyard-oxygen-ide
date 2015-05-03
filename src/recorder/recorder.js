/*
 * Copyright 2005 Shinya Kasatani
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

function Recorder() {
    this.attach();
}

Recorder.cmdSend = function (command, target, value, timestamp) {
    console.log("Command: " + command + ", target: " + target + ", value: " + value + ", timestamp: " + timestamp);
    if (value == "" && command != "type") { // ommit empty values from serialization
        value = null;
    }

    // target is an array containing all available locators or an string for commands which doesn't
    // use locator in the target parameter
    var trg, trgLocs;
    if (target.constructor === Array) {
        trg = target[0][0];
        trgLocs = target;
    } else {
        trg = target;
        trgLocs = null;
    }

    var data = JSON.stringify(
        { "cmd": command, "target": trg, "targetLocators": trgLocs, "value": value, "timestamp": timestamp },
        function (k, v) { return (v == null) ? undefined : v;});

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", Recorder.GetIdeUrl());
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if(xmlhttp.status != 400) {
                console.log("Error sending command: " + xmlhttp.statusText);
            }
        }
    }
    xmlhttp.send(data);
}

Recorder.prototype.reattachWindowMethods = function() {
	if (!this.windowMethods) {
		this.originalOpen = window.open;
	}
	this.windowMethods = {};
	['alert', 'confirm', 'prompt', 'open'].forEach(function(method) {
			this.windowMethods[method] = window[method];
		}, this);
	var self = this;
	window.alert = function(alert) {
	    self.windowMethods['alert'].call(self.window, alert);
        self.record('assertAlert', alert);
	}
	window.confirm = function(message) {
		var result = self.windowMethods['confirm'].call(self.window, message);
		if (!result) {
			self.record('chooseCancelOnNextConfirmation', null, null, true);
		}
        self.record('assertConfirmation', message);
		return result;
	}
	window.prompt = function(message) {
		var result = self.windowMethods['prompt'].call(self.window, message);
		self.record('answerOnNextPrompt', result, null, true);
        self.record('assertPrompt', message);
		return result;
	}
	window.open = function (url, windowName, windowFeatures, replaceFlag) {
		if (self.openCalled) {
			// stop the recursion called by modifyWindowToRecordPopUpDialogs
			return self.originalOpen.call(window, url, windowName, windowFeatures, replaceFlag);
		} else {
			self.openCalled = true;
			var result = self.windowMethods['open'].call(window, url, windowName, windowFeatures, replaceFlag);
			self.openCalled = false;
            if (result.wrappedJSObject) {
                result = result.wrappedJSObject;
            }
			setTimeout(Recorder.record, 0, self, 'waitForPopUp', windowName, "30000");
			return result;
		}
	}
}

Recorder.prototype.parseEventKey = function(eventKey) {
	if (eventKey.match(/^C_/)) {
		return { eventName: eventKey.substring(2), capture: true };
	} else {
		return { eventName: eventKey, capture: false };
	}
}

Recorder.prototype.attach = function() {
    console.log("attaching");
	this.locatorBuilders = new LocatorBuilders(window);
	this.eventListeners = {};
	this.reattachWindowMethods();
	var self = this;
	for (eventKey in Recorder.eventHandlers) {
		var eventInfo = this.parseEventKey(eventKey);
		var eventName = eventInfo.eventName;
		var capture = eventInfo.capture;
		// create new function so that the variables have new scope.
		function register() {
			var handlers = Recorder.eventHandlers[eventKey];
			//console.log('eventName=' + eventName + ' / handlers.length=' + handlers.length);
			var listener = function(event) {
				for (var i = 0; i < handlers.length; i++) {
                    handlers[i].call(self, event);
				}
			}
			if (browserVersion.isIE && browserVersion.ieMode < 11) {
			    window.document.attachEvent("on" + eventName, listener);
			} else {
			    window.document.addEventListener(eventName, listener, capture);
			}
			this.eventListeners[eventKey] = listener;
		}
		register.call(this);
	}

	var lw = JSON.stringify(new LastWindow(window));
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", Recorder.GetIdeUrl() + "/lastwin_store");
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if(xmlhttp.status != 400) {
                console.log("Error sending command: " + xmlhttp.statusText);
            }
        }
    }
    xmlhttp.send(lw);

	Recorder.cmdSend('open', document.URL, null, (new Date()).getTime());
}

Recorder.record = function (recorder, command, target, value) {
    recorder.record(command, target, value);
}

Recorder.prototype.record = function (command, target, value, insertBeforeLastCommand) {
    var curDateForWin = (new Date).getTime();
    
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", Recorder.GetIdeUrl() + "/lastwin_store", false);
    xmlhttp.send(JSON.stringify(new LastWindow(window)));
    if (xmlhttp.status !== 400) {
      console.log("AJAX lastwin_store error: " + xmlhttp.statusText);
    }
    var lw = xmlhttp.responseText;
    if (lw != 'False') {
        if (!Recorder.isSameWindow(lw, window)) {
            var send_frame = false;
            var send_win = false;
            // it can be different window OR a different frame in same window OR different frame in different window
            console.log("is frame: " + (window != window.top));
            if (window != window.top) { // check if frame
                try {                   // IE9-11: results in Access Denied when accessing parent since script is injected into all "plain/html" sources
                    if (lw.parenthash != window.parent.__hash) {
                        send_win = true;
                    }
                } catch (e) { }
                send_frame = true;
            } else {
                try {
                    if (lw.isTopLevel && window.top == window.top.parent) {
                        send_win = lw.topName != window.top.name;
                    } else {
                        send_win = false;
                    }
                } catch (e) { }
            }

            if (send_win) {
                Recorder.cmdSend("selectWindow", (window.name == '') ? '' : "name=" + window.name, null, curDateForWin);
            }
            if (send_frame) {
                var destPath = createPath(window);
                var srcPath = createPath(lw);
                console.log("selectFrame: srcPath.length=" + srcPath.length + ", destPath.length=" + destPath.length);
                var branch = 0;
                var i;
                for (i = 0; ; i++) {
                    if (i >= destPath.length || i >= srcPath.length) {
                        break;
                    }
                    if (destPath[i] == srcPath[i]) {
                        branch = i;
                    }
                }
                console.log("branch=" + branch);
                if (branch == 0 && srcPath.size > 1) {
                    // go to root
                    Recorder.cmdSend("selectFrame", "relative=top", null, ++curDateForWin);
                } else {
                    for (i = srcPath.length - 1; i > branch; i--) {
                        Recorder.cmdSend("selectFrame", "relative=up", null, ++curDateForWin);
                    }
                }
                for (i = branch + 1; i < destPath.length; i++) {
                     Recorder.cmdSend("selectFrame", (destPath[i].name != '') ? destPath[i].name : "index=" + i, null, ++curDateForWin);
                }
            }
        }
    }

    Recorder.cmdSend(command, target, value, (new Date).getTime())
}

function createPath(window) {
    var path = [];
    var lastWindow = null;
    try {
        while (window != lastWindow) {
            path.unshift(window);
            lastWindow = window;
            window = lastWindow.parent;
        }
    } catch (e) { }
    return path;
};

Recorder.prototype.findLocator = function (element) {
	return this.locatorBuilders.build(element);
}

Recorder.prototype.findLocators = function (element) {
    var locators = this.locatorBuilders.buildAll(element);
    //console.log('Locators: ' + locators);
    return locators;
}

Recorder.addEventHandler = function(handlerName, eventName, handler, options) {
	handler.handlerName = handlerName;
	if (!options) options = {};
	var key = options['capture'] ? ('C_' + eventName) : eventName;
	if (!this.eventHandlers[key]) {
		this.eventHandlers[key] = [];
	}
	this.eventHandlers[key].push(handler);
}

Recorder.removeEventHandler = function(handlerName) {
	for (eventKey in this.eventHandlers) {
		var handlers = this.eventHandlers[eventKey];
		for (var i = 0; i < handlers.length; i++) {
			if (handlers[i].handlerName == handlerName) {
				handlers.splice(i, 1);
				break;
			}
		}
	}
}

Recorder.eventHandlers = {};

Recorder.GetIdeUrl = function() {
    return location.protocol === 'https:' ? "https://localhost:8889" : "http://localhost:7778";
}

function LastWindow(window) {
    var hash;
    var phash = null;
    // create 'hash' for the window and its parent
    if ('__hash' in window){
        hash = window.__hash;
    } else {
        hash = Recorder.guid();
        window['__hash'] = hash;
    }
    try {
        if ('__hash' in window.parent) {
            phash = window.parent.__hash;
        } else {
            phash = Recorder.guid();
            window.parent['__hash'] = phash;
        }
        this.isTopLevel = window == window.parent;
        this.topName = window.top.name;
    } catch (exc) { }

    this.hash = hash;
    this.parenthash = phash;
    this.history = history.length;
    this.isFrame = window != window.top;

    console.log("LastWin " + this.hash + " - " + this.isFrame);
}

Recorder.guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
}

Recorder.isSameWindow = function (lastwin, window) {
    console.log('isSameWindow lw:' + lastwin.hash + " win: " + window.__hash);
    if (!window.__hash) {
        return false;
    } 
    return lastwin.hash == window.__hash;
}

Recorder.inputTypes = ["text", "password", "file", "datetime", "datetime-local", "date", "month", "time", "week", "number", "range", "email", "url", "search", "tel", "color"];
Recorder.addEventHandler('type', 'change', function (ev, check_prev) {
	console.log('event handler: type, change');
    var ev = ev || window.event;				// IE 9 quirks mode fix. event is global. also srcElement instead of target.
    var target = ev.target || ev.srcElement;
	if (check_prev && target.value == this.activeElementValue) {	// value hasn't changed
		return;
	}
    if (target.tagName) {
        var tagName = target.tagName.toLowerCase();
        var type = target.type;
        if ('input' == tagName && Recorder.inputTypes.indexOf(type) >= 0) {
            if (target.value.length > 0) {
                // TODO figure out if we need sendKeys or type and record it
                this.record("type", this.findLocators(target), target.value);
            } else {
                //use type to clear
                this.record("type", this.findLocators(target), target.value);
            }
        } else if ('textarea' == tagName) {
            //use type for file uploads
            this.record("type", this.findLocators(target), target.value);
        }
    }
});

// IE 9 Quirks mode. To simulate "change" event we catch focusin/out and handle those. 
if (browserVersion.isIE && browserVersion.ieMode < 11) {
    // TODO: select multiselect
    Recorder.addEventHandler('input-select', 'focusin', function (ev) {
        console.log('event handler: input-select, focusin');
        var target = ev.srcElement;

        if (target.nodeName.toLowerCase() === "input" || target.nodeName.toLowerCase() === "textarea") {
            this.activeElementValue = target.value;
        } else if (target.nodeName.toLowerCase() == "select") {
            this.activeElementValue = target.options[target.selectedIndex];
        }
    });

    Recorder.addEventHandler('input-select', 'focusout', function (ev) {
        console.log('event handler: input-select, focusout');
        if (!this.activeElementValue) return;

        var target = ev.srcElement;

        if (target.nodeName.toLowerCase() === "select") {
            var changeHandlers = Recorder.eventHandlers["change"];
            for (var i = 0; i < changeHandlers.length; i++) {
                if (changeHandlers[i].handlerName == "select") {
                    changeHandlers[i].call(this, ev, true);
                    break;
                }
            }
        } else if (target.nodeName.toLowerCase() === "input") {
            var changeHandlers = Recorder.eventHandlers["change"];
            for (var i = 0; i < changeHandlers.length; i++) {
                if (changeHandlers[i].handlerName == "type") {
                    changeHandlers[i].call(this, ev, true);
                    break;
                }
            }
        }

        this.activeElementValue = null;
    });
}

if (!browserVersion.isIE || browserVersion.ieMode >= 11) {
    Recorder.addEventHandler('selectFocus', 'focus', function (ev) {
        var ev = ev || window.event;
        var target = ev.target || ev.srcElement;
        if (target.nodeName) {
            var tagName = target.nodeName.toLowerCase();
            if ('select' == tagName && target.multiple) {
                console.log('remembering selections');
                var options = target.options;
                for (var i = 0; i < options.length; i++) {
                    if (options[i]._wasSelected == null) {
                        // is the focus was gained by mousedown event, _wasSelected would be already set
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
    }, { capture: true });
}

Recorder.addEventHandler('selectMousedown', 'mousedown', function (ev) {
    console.log('event handler: selectMousedown, mousedown');
    var ev = ev || window.event;
    var target = ev.target || ev.srcElement;
    if (target.nodeName) {
        var tagName = target.nodeName.toLowerCase();
        if ('option' == tagName) {
            var parent = target.parentNode;
            if (parent.multiple) {
                console.log('remembering selections');
                var options = parent.options;
                for (var i = 0; i < options.length; i++) {
                    options[i]._wasSelected = options[i].selected;
                }
            }
        }
    }
}, { capture: true });

Recorder.prototype.getOptionLocator = function (option) {
    var label = option.text.replace(/^ *(.*?) *$/, "$1");
    if (label.match(/\xA0/)) { // if the text contains &nbsp;
        return "label=regexp:" + label.replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, function (str) { return '\\' + str })
                                      .replace(/\s+/g, function (str) {
                                          if (str.match(/\xA0/)) {
                                            return (str.length > 1 ? "\\s+" : "\\s");
                                          } else {
                                            return str;
                                          }
                                      });
    } else {
        return "label=" + label;
    }
};

Recorder.addEventHandler('select', 'change', function(ev, check_prev) {
    console.log('event handler: select, change');
    var ev = ev || window.event;
    var target = ev.target || ev.srcElement;
    if (target.tagName) {
        var tagName = target.tagName.toLowerCase();
        if ('select' == tagName) {
            if (!target.multiple) {
                var option = target.options[target.selectedIndex];
				if (check_prev && this.activeElementValue == option) {	// value did not change
					return;
				}
                console.log('selectedIndex=' + target.selectedIndex);
                this.record("select", this.findLocators(target), this.getOptionLocator(option));
            } else {
                console.log('change selection on select-multiple');
                var options = target.options;
                for (var i = 0; i < options.length; i++) {
                    console.log('option=' + i + ', ' + options[i].selected);
                    if (options[i]._wasSelected == null) {
                        console.log('_wasSelected was not recorded');
                    }
                    if (options[i]._wasSelected != options[i].selected) {
                        var value = this.getOptionLocator(options[i]);
                        if (options[i].selected) {
                            this.record("addSelection", this.findLocators(target), value);
                        } else {
                            this.record("removeSelection", this.findLocators(target), value);
                        }
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
	}
});

Recorder.addEventHandler('clickLocator', 'click', function (ev) {
    console.log('event handler: clickLocator, click');
    var ev = ev || window.event;
    var target = ev.target || ev.srcElement;
    if (ev.button == 0) {
        var clickable = this.findClickableElement(target);
        if (clickable) {
            this.record("click", this.findLocators(target), '');
        } else {
            this.callIfMeaningfulEvent(function () {
                this.record("click", this.findLocators(target), '');
            });
        }
    }
}, { capture: true });

Recorder.prototype.findClickableElement = function (e) {
	//console.log('finding clickable...');
    if (!e.tagName) return null;
    var tagName = e.tagName.toLowerCase();
    var type = e.type;
    if (e.getAttribute("onclick") != null || e.getAttribute("href") != null || tagName == "button" ||
		(tagName == "input" &&
		 (type == "submit" || type == "button" || type == "image" || type == "radio" || type == "checkbox" || type == "reset"))) {
        return e;
    } else {
        if (e.parentNode != null) {
            return this.findClickableElement(e.parentNode);
        } else {
            return null;
        }
    }
};

Recorder.addEventHandler('attrModified', 'DOMAttrModified', function (event) {
    console.log('event handler: attrModified, DOMAttrModified');
    this.domModified();
}, { capture: true });

Recorder.addEventHandler('nodeInserted', 'DOMNodeInserted', function (event) {
    console.log('event handler: nodeInserted, DOMNodeInserted');
    this.domModified();
}, { capture: true });

Recorder.addEventHandler('nodeRemoved', 'DOMNodeRemoved', function (event) {
    console.log('event handler: nodeRemoved, DOMNodeRemoved');
    this.domModified();
}, { capture: true });

Recorder.prototype.domModified = function () {
    if (this.delayedRecorder) {
        this.delayedRecorder.apply(this);
        this.delayedRecorder = null;
        if (this.domModifiedTimeout) {
            clearTimeout(this.domModifiedTimeout);
        }
    }
};

Recorder.prototype.callIfMeaningfulEvent = function (handler) {
    console.log("Meaningfull event!");
    this.delayedRecorder = handler;
    var self = this;
    this.domModifiedTimeout = setTimeout(function () {
        console.log("clear event");
        self.delayedRecorder = null;
        self.domModifiedTimeout = null;
    }, 50);
};

new Recorder();
