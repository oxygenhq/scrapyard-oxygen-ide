/*
 * Copyright 2005 Shinya Kasatani
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

function Recorder() {
    this.attach();
}

Recorder.cmdSend = function (command, target, value, timestamp) {
    console.log("Command: " + command + ", target: " + target + ", value: " + value + ", timestamp: " + timestamp);
    if (value === "" && command != "type") { // ommit empty values from serialization
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
        function (k, v) { return (v === null || v === undefined) ? undefined : v;});

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", Recorder.GetIdeUrl(), false);
    xmlhttp.send(data);
    if (xmlhttp.status !== 200) {
        console.log("ERROR cmdSend: " + xmlhttp.statusText);
    }
};

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
        self.windowMethods.alert.call(self.window, alert);
        self.record('assertAlert', alert);
    };
    window.confirm = function(message) {
        var result = self.windowMethods.confirm.call(self.window, message);
        if (!result) {
            self.record('chooseCancelOnNextConfirmation', null, null, true);
        }
        self.record('assertConfirmation', message);
        return result;
    };
    window.prompt = function(message) {
        var result = self.windowMethods.prompt.call(self.window, message);
        self.record('answerOnNextPrompt', result, null, true);
        self.record('assertPrompt', message);
        return result;
    };
    window.open = function (url, windowName, windowFeatures, replaceFlag) {
        if (self.openCalled) {
            // stop the recursion called by modifyWindowToRecordPopUpDialogs
            return self.originalOpen.call(window, url, windowName, windowFeatures, replaceFlag);
        } else {
            self.openCalled = true;
            var result = self.windowMethods.open.call(window, url, windowName, windowFeatures, replaceFlag);
            self.openCalled = false;
            result.addEventListener('DOMContentLoaded', function() {
                var winLocator = this.document.title === '' ? '' : 'title=' + this.document.title;
                self.record('waitForWindow', winLocator, 30000);
            }, false);
            return result;
        }
    };
};

Recorder.prototype.parseEventKey = function(eventKey) {
    if (eventKey.match(/^C_/)) {
        return { eventName: eventKey.substring(2), capture: true };
    } else {
        return { eventName: eventKey, capture: false };
    }
};

Recorder.prototype.attach = function() {
    console.log("attaching");
    this.locatorBuilders = new LocatorBuilders(window);
    this.locatorFrameBuilders = new LocatorFrameBuilders(window);
    this.eventListeners = {};
    this.reattachWindowMethods();
    var self = this;
    for (var eventKey in Recorder.eventHandlers) {
        var eventInfo = this.parseEventKey(eventKey);
        var eventName = eventInfo.eventName;
        var capture = eventInfo.capture;
        // create new function so that the variables have new scope.
        function register() { // jshint ignore:line
            var handlers = Recorder.eventHandlers[eventKey];
            //console.log('eventName=' + eventName + ' / handlers.length=' + handlers.length);
            var listener = function(event) {
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i].call(self, event);
                }
            };
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
            }
        }
    };
    xmlhttp.send(lw);

    // Set-up a load event handler for all the frames/iframes in this window which will generate
    // frame locators and send them to the appropriate frame using postMessage.
    this.setFrameLoadHandler(document.getElementsByTagName("iframe"));
    this.setFrameLoadHandler(document.getElementsByTagName("frame"));
    // Complementary, at the frame's side, setup a message listener which will receive those 
    // locators and store them in the frame's Window object.
    try {
        if (window.self !== window.top) {
            window.addEventListener(
                "message", 
                function(e) {
                    if (e.data && typeof e.data === "string" && e.data.indexOf('__frameLocators') === 0) {
                        window.__frameLocators = JSON.parse(e.data.substring('__frameLocators'.length));
                    }
                }, 
                false
            ); 
        }
    } catch (e) {
        return true;
    }
};

Recorder.prototype.setFrameLoadHandler = function (frames) {
    var self = this;
    for (var i = 0; i < frames.length; i++) {
        (function (iCopy) {
            frames[i].addEventListener('load', function() {
                var locs = self.findFrameLocators(frames[iCopy]);
                // NOTE: IE 9 is very unreliable when it comes to objects/Arrays passed to 
                //       postMessage. use String instead!
                frames[iCopy].contentWindow.postMessage('__frameLocators' + JSON.stringify(locs), '*');
            });
        }(i));
    } 
};

Recorder.prototype.record = function (command, target, value, insertBeforeLastCommand) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", Recorder.GetIdeUrl() + "/lastwin_update", false);
    xmlhttp.send(JSON.stringify(new LastWindow(window)));
    if (xmlhttp.status !== 200) {
        console.log("AJAX lastwin_update error: " + xmlhttp.statusText);
        return;
    }

    if (xmlhttp.responseText !== 'False') {
        var lw = JSON.parse(xmlhttp.responseText);    
        if (!Recorder.isSameWindow(lw, window)) {
            var send_frame = false;
            var send_win = false;
            // it can be different window OR a different frame in same window OR different frame in different window
            if (window != window.top) { // check if frame
                try {                   // accessing parent throws exception if frame is from a different origin
                    if (lw.parenthash != window.parent.__hash) {
                        send_win = true;
                    }
                } catch (e) { }
                send_frame = true;
            } else {
                try {
                    if (lw.isTopLevel === undefined) {   // different origin => different window
                        send_win = true;
                    } else {
                        send_win = lw.topName != window.top.name;
                    }
                } catch (e) { }
            }

            if (send_win) {
                var winLocator;
                try {
                    winLocator = parent.document.title === '' ? '' : 'title=' + parent.document.title;
                } catch (e) {
                    winLocator = window.document.title === '' ? '' : 'title=' + window.document.title;
                }
                Recorder.cmdSend("selectWindow", winLocator, null, (new Date()).getTime());
            }
            if (send_frame) {
                 // record selectFrame only if locators were successfully generated
                if (window.__frameLocators) {
                    Recorder.cmdSend("selectFrame", window.__frameLocators, null, (new Date()).getTime());
                }
            }
        }
    }

    Recorder.cmdSend(command, target, value, (new Date()).getTime());
};

Recorder.prototype.findLocator = function (element) {
    return this.locatorBuilders.build(element);
};

Recorder.prototype.findLocators = function (element) {
    return this.locatorBuilders.buildAll(element);
};

Recorder.prototype.findFrameLocators = function (element) {
    return this.locatorFrameBuilders.buildAll(element);
};

Recorder.addEventHandler = function(handlerName, eventName, handler, options) {
    handler.handlerName = handlerName;
    if (!options) options = {};
    var key = options.capture ? ('C_' + eventName) : eventName;
    if (!this.eventHandlers[key]) {
        this.eventHandlers[key] = [];
    }
    this.eventHandlers[key].push(handler);
};

Recorder.removeEventHandler = function(handlerName) {
    for (var eventKey in this.eventHandlers) {
        var handlers = this.eventHandlers[eventKey];
        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i].handlerName == handlerName) {
                handlers.splice(i, 1);
                break;
            }
        }
    }
};

Recorder.eventHandlers = {};

Recorder.GetIdeUrl = function() {
    return location.protocol === 'https:' ? "https://localhost:8889" : "http://localhost:7778";
};

function LastWindow(window) {
    var hash;
    var phash = null;
    // create 'hash' for the window and its parent
    if ('__hash' in window){
        hash = window.__hash;
    } else {
        hash = Recorder.guid();
        window.__hash = hash;
    }
    try {
        if ('__hash' in window.parent) {
            phash = window.parent.__hash;
        } else {
            phash = Recorder.guid();
            window.parent.__hash = phash;
        }
        this.isTopLevel = window == window.parent;
        this.topName = window.top.name;
    } catch (exc) { }

    this.hash = hash;
    this.parenthash = phash;

    console.log("LastWin " + this.hash);
}

Recorder.guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
};

Recorder.isSameWindow = function (lastwin, window) {
    console.log('isSameWindow lw:' + lastwin.hash + " win: " + window.__hash);
    if (!window.__hash) {
        return false;
    } 
    return lastwin.hash == window.__hash;
};

Recorder.inputTypes = ["text", "password", "file", "datetime", "datetime-local", "date", "month", "time", "week", "number", "range", "email", "url", "search", "tel", "color"];
Recorder.addEventHandler('type', 'change', function (ev, check_prev) {
    console.log('event: type, change');
    var ev = ev || window.event;                // IE 9 quirks mode fix. event is global. also srcElement instead of target.
    var target = ev.target || ev.srcElement;
    if (check_prev && target.value == this.activeElementValue) {    // value hasn't changed
        return;
    }
    if (target.tagName) {
        var tagName = target.tagName.toLowerCase();
        var type = target.type;
        if ('input' == tagName && Recorder.inputTypes.indexOf(type) >= 0 ||
            'textarea' == tagName) {
            if (target.value.length > 0) {
                this.record("type", this.findLocators(target), target.value);
            } else {
                this.record("clear", this.findLocators(target), target.value);
            }
        }
    }
});

// IE 9 Quirks mode. To simulate "change" event we catch focusin/out and handle those. 
if (browserVersion.isIE && browserVersion.ieMode < 11) {
    // TODO: select multiselect
    Recorder.addEventHandler('input-select', 'focusin', function (ev) {
        console.log('event: input-select, focusin');
        var target = ev.srcElement;

        if (target.nodeName.toLowerCase() === "input" || target.nodeName.toLowerCase() === "textarea") {
            this.activeElementValue = target.value;
        } else if (target.nodeName.toLowerCase() == "select") {
            this.activeElementValue = target.options[target.selectedIndex];
        }
    });

    Recorder.addEventHandler('input-select', 'focusout', function (ev) {
        console.log('event: input-select, focusout');
        if (!this.activeElementValue) return;

        var target = ev.srcElement;

        if (target.nodeName.toLowerCase() === "select") {
            var changeHandlers = Recorder.eventHandlers.change;
            for (var i = 0; i < changeHandlers.length; i++) {
                if (changeHandlers[i].handlerName == "select") {
                    changeHandlers[i].call(this, ev, true);
                    break;
                }
            }
        } else if (target.nodeName.toLowerCase() === "input") {
            var changeHandlers = Recorder.eventHandlers.change;
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
                    if (options[i]._wasSelected === null || options[i]._wasSelected === undefined) {
                        // is the focus was gained by mousedown event, _wasSelected would be already set
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
    }, { capture: true });
}

Recorder.addEventHandler('selectMousedown', 'mousedown', function (ev) {
    console.log('event: selectMousedown, mousedown');
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
        return "label=regexp:" + label.replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, function (str) { return '\\' + str }) // jshint ignore:line
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
    console.log('event: select, change');
    var ev = ev || window.event;
    var target = ev.target || ev.srcElement;
    if (target.tagName) {
        var tagName = target.tagName.toLowerCase();
        if ('select' == tagName) {
            if (!target.multiple) {
                var option = target.options[target.selectedIndex];
                if (check_prev && this.activeElementValue == option) {    // value did not change
                    return;
                }
                console.log('selectedIndex=' + target.selectedIndex);
                this.record("select", this.findLocators(target), this.getOptionLocator(option));
            } else {
                console.log('change selection on select-multiple');
                var options = target.options;
                for (var i = 0; i < options.length; i++) {
                    console.log('option=' + i + ', ' + options[i].selected);
                    if (options[i]._wasSelected === null || options[i]._wasSelected === undefined) {
                        console.log('_wasSelected was not recorded');
                    }
                    if (options[i]._wasSelected != options[i].selected) {
                        var value = this.getOptionLocator(options[i]);
                        if (options[i].selected) {
                            this.record("select", this.findLocators(target), value);
                        } else {
                            this.record("deselect", this.findLocators(target), value);
                        }
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
    }
});

Recorder.addEventHandler('clickLocator', 'click', function (ev) {
    console.log('event: clickLocator, click');
    var ev = ev || window.event;
    var target = ev.target || ev.srcElement;
    if (ev.button === 0) {
        var clickable = this.findClickableElement(target);
        if (clickable) {
            this.record("click", this.findLocators(target), '');
        } else {
			// if we get here it means that the event has generated a new dynamic content
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
    if (e.getAttribute("onclick") !== null || e.getAttribute("href") !== null || tagName == "button" ||
        (tagName == "input" &&
         (type == "submit" || type == "button" || type == "image" || type == "radio" || type == "checkbox" || type == "reset"))) {
        return e;
    } else {
        if (e.parentNode !== null && e.parentNode !== undefined) {
            return this.findClickableElement(e.parentNode);
        } else {
            return null;
        }
    }
};

Recorder.addEventHandler('attrModified', 'DOMAttrModified', function (event) {
    console.log('event: DOMAttrModified');
    this.domModified();
}, { capture: true });

Recorder.addEventHandler('nodeInserted', 'DOMNodeInserted', function (event) {
    if (event.target.tagName !== undefined && event.target.tagName.toLowerCase() === 'iframe') {
        this.setFrameLoadHandler([event.target]);
    }
    console.log('event: DOMNodeInserted');
    this.domModified();
}, { capture: true });

Recorder.addEventHandler('nodeRemoved', 'DOMNodeRemoved', function (event) {
    console.log('event: DOMNodeRemoved');
    this.domModified();
}, { capture: true });

Recorder.prototype.domModified = function () {
    if (this.delayedRecorder) {
        // recorder might take some time to complete so it should be cleared before it's executed
        // otherwise too many consecutive DOMNode* events might lead to a situation with multiple
        // recorders being invoked.
        var delayedRec = this.delayedRecorder;
        this.delayedRecorder = null;
        if (this.domModifiedTimeout) {
            clearTimeout(this.domModifiedTimeout);
        }
        delayedRec.apply(this);
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
    }, 500);	// timeout increased from 50ms to 500ms due as some DOM changes take longer to catch then 50ms (ex. DudaMobile)
};

new Recorder();
