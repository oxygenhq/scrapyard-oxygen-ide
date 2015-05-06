/*
* Copyright 2011 Software Freedom Conservancy
*  Licensed under the Apache License, Version 2.0 (the "License");
*/

/*
* This script provides the Javascript API to drive the test application contained within
* a Browser Window.
* TODO:
*    Add support for more events (keyboard and mouse)
*    Allow to switch "user-entry" mode from mouse-based to keyboard-based, firing different
*          events in different modes.
*/

// The window to which the commands will be sent.  For example, to click on a
// popup window, first select that window, and then do a normal click command.
var BrowserBot = function(topLevelApplicationWindow) {
    this.topWindow = topLevelApplicationWindow;
    this.topFrame = this.topWindow;
    this.baseUrl=window.location.href;

    // the buttonWindow is the Selenium window
    // it contains the Run/Pause buttons... this should *not* be the AUT window
    this.buttonWindow = window;
    this.currentWindow = this.topWindow;
    this.currentWindowName = null;
    this.allowNativeXpath = true;
    this.xpathEvaluator = new XPathEvaluator('wgxpath');
    
    // We need to know this in advance, in case the frame closes unexpectedly
    this.isSubFrameSelected = false;

    this.altKeyDown = false;
    this.controlKeyDown = false;
    this.shiftKeyDown = false;
    this.metaKeyDown = false;

    this.modalDialogTest = null;
    this.recordedAlerts = [];
    this.recordedConfirmations = [];
    this.recordedPrompts = [];
    this.openedWindows = {};
    this.nextConfirmResult = true;
    this.nextPromptResult = '';
    this.newPageLoaded = false;
    this.pageLoadError = null;

    this.ignoreResponseCode = false;
    this.xhr = null;
    this.abortXhr = false;
    this.isXhrSent = false;
    this.isXhrDone = false;
    this.xhrOpenLocation = null;
    this.xhrResponseCode = null;
    this.xhrStatusText = null;

    this.shouldHighlightLocatedElement = false;

    this.uniqueId = "seleniumMarker" + new Date().getTime();
    this.pollingForLoad = {};
    this.permDeniedCount = {};
    this.windowPollers = [];
    // DGF for backwards compatibility
    this.browserbot = this;

    var self = this;

    objectExtend(this, PageBot.prototype);
    this._registerAllLocatorFunctions();

    this.recordPageLoad = function(elementOrWindow) {
        console.log("Page load detected");
        try {
            if (elementOrWindow.location && elementOrWindow.location.href) {
                console.log("Page load location=" + elementOrWindow.location.href);
            } else if (elementOrWindow.contentWindow && elementOrWindow.contentWindow.location && elementOrWindow.contentWindow.location.href) {
                console.log("Page load location=" + elementOrWindow.contentWindow.location.href);
            } else {
                console.log("Page load location unknown, current window location=" + self.getCurrentWindow(true).location);
            }
        } catch (e) {
            console.log("Caught an exception attempting to log location; this should get noticed soon!");
            console.log(e);
            self.pageLoadError = e;
            return;
        }
        self.newPageLoaded = true;
    };
};

// DGF PageBot exists for backwards compatibility with old user-extensions
var PageBot = function(){};

BrowserBot.prototype._windowClosed = function(win) {
    try {
        var c = win.closed;
        if (c == null) return true;
        return c;
    } catch (ignored) {
        // Firefox 15+ may already have marked the win dead. Accessing it
        // causes an exception to be thrown. That exception tells us the window
        // is closed.
        return true;
    }
};

BrowserBot.uniqueKey = 1;

BrowserBot.prototype._modifyWindow = function(win) {
    // In proxyInjectionMode, have to suppress LOG calls in _modifyWindow to avoid an infinite loop
    if (this._windowClosed(win)) {
        if (!this.proxyInjectionMode) {
            console.log("modifyWindow: Window was closed!");
        }
        return null;
    }
    if (!this.proxyInjectionMode) {
        console.log('modifyWindow ' + this.uniqueId + ":" + win[this.uniqueId]);
    }

    // Assign a unique label for this window. We set this on a known attribute so we can reliably
    // find it later. This is slightly different from uniqueId.
    win.seleniumKey = BrowserBot.uniqueKey++;

    this.modifyWindowToRecordPopUpDialogs(win, this);

    if (win.frames && win.frames.length && win.frames.length > 0) {
        for (var i = 0; i < win.frames.length; i++) {
            try {
                this._modifyWindow(win.frames[i]);
            } catch (e) {} // we're just trying to be opportunistic; don't worry if this doesn't work out
        }
    }
    return win;
};

BrowserBot.prototype.selectFrame = function(target) {
    var frame;
    
    if (target.indexOf("index=") == 0) {
        target = target.substr(6);
        frame = this.getCurrentWindow().frames[target];
        if (frame == null) {
            throw new SeleniumError("Not found: frames["+target+"]");
        }
        if (!frame.document) {
            throw new SeleniumError("frames["+target+"] is not a frame");
        }
        this.currentWindow = frame;
        this.isSubFrameSelected = true;
    }
    else if (target == "relative=up" || target == "relative=parent") {
        this.currentWindow = this.getCurrentWindow().parent;
        this.isSubFrameSelected = (this._getFrameElement(this.currentWindow) != null);
    } else if (target == "relative=top") {
        this.currentWindow = this.topFrame;
        this.isSubFrameSelected = false;
    } else {
        frame = this.findElement(target);
        if (frame == null) {
            throw new SeleniumError("Not found: " + target);
        }
        // now, did they give us a frame or a frame ELEMENT?
        var match = false;
        if (frame.contentWindow) {
            // this must be a frame element
            if (browserVersion.isHTA) {
                // stupid HTA bug; can't get in the front door
                target = frame.contentWindow.name;
            } else {
                this.currentWindow = frame.contentWindow;
                this.isSubFrameSelected = true;
                match = true;
            }
        } else if (frame.document && frame.location) {
            // must be an actual window frame
            this.currentWindow = frame;
            this.isSubFrameSelected = true;
            match = true;
        }

        if (!match) {
            // neither, let's loop through the frame names
            var win = this.getCurrentWindow();

            if (win && win.frames && win.frames.length) {
                for (var i = 0; i < win.frames.length; i++) {
                    if (win.frames[i].name == target) {
                        this.currentWindow = win.frames[i];
                        this.isSubFrameSelected = true;
                        match = true;
                        break;
                    }
                }
            }
            if (!match) {
                throw new SeleniumError("Not a frame: " + target);
            }
        }
    }
    // modifies the window
    this.getCurrentWindow();
};

BrowserBot.prototype.windowNeedsModifying = function(win, uniqueId) {
    // On anything but Firefox, checking the unique id is enough.
    // Firefox 4 introduces a race condition which selenium regularly loses.

    try {
        var appInfo = Components.classes['@mozilla.org/xre/app-info;1'].
            getService(Components.interfaces.nsIXULAppInfo);
        var versionChecker = Components.
            classes['@mozilla.org/xpcom/version-comparator;1'].
            getService(Components.interfaces.nsIVersionComparator);

        if (versionChecker.compare(appInfo.version, '4.0b1') >= 0) {
            return win.alert.toString().indexOf("native code") != -1;
        }
    } catch (ignored) {}
    return !win[uniqueId];
};


BrowserBot.prototype.modifyWindowToRecordPopUpDialogs = function(originalWindow, browserBot) {
    var self = this;
    var windowToModify = originalWindow;
    windowToModify.seleniumAlert = windowToModify.alert;

    if (!self.windowNeedsModifying(windowToModify, browserBot.uniqueId)) {
        return;
    }

    // Keep a reference to all popup windows by name
    // note that in IE the "windowName" argument must be a valid javascript identifier, it seems.
    var originalOpen = windowToModify.open;
    var originalOpenReference;
    if (browserVersion.isHTA) {
        originalOpenReference = 'selenium_originalOpen' + new Date().getTime();
        windowToModify[originalOpenReference] = windowToModify.open;
    }

    var isHTA = browserVersion.isHTA;

    var newOpen = function(url, windowName, windowFeatures, replaceFlag) {
        var myOriginalOpen = originalOpen;
        if (isHTA) {
            myOriginalOpen = this[originalOpenReference];
        }
        if (windowName == "" || windowName == "_blank") {
            windowName = "selenium_blank" + Math.round(100000 * Math.random());
            console.log("Opening window '_blank', which is not a real window name.  Randomizing target to be: " + windowName);
        }
        var openedWindow = myOriginalOpen(url, windowName, windowFeatures, replaceFlag);
        console.log("window.open call intercepted; window ID (which you can use with selectWindow()) is \"" +  windowName + "\"");
        if (windowName!=null) {
            openedWindow["seleniumWindowName"] = windowName;
        }
        selenium.browserbot.openedWindows[windowName] = openedWindow;
        return openedWindow;
    };

    if (browserVersion.isHTA) {
        originalOpenReference = 'selenium_originalOpen' + new Date().getTime();
        newOpenReference = 'selenium_newOpen' + new Date().getTime();
        var setOriginalRef = "this['" + originalOpenReference + "'] = this.open;";

        if (windowToModify.eval) {
            windowToModify.eval(setOriginalRef);
            windowToModify.open = newOpen;
        } else {
            // DGF why can't I eval here?  Seems like I'm querying the window at a bad time, maybe?
            setOriginalRef += "this.open = this['" + newOpenReference + "'];";
            windowToModify[newOpenReference] = newOpen;
            windowToModify.setTimeout(setOriginalRef, 0);
        }
    } else {
        windowToModify.open = newOpen;
    }
};

/**
 * Call the supplied function when a the current page unloads and a new one loads.
 * This is done by polling continuously until the document changes and is fully loaded.
 */
BrowserBot.prototype.modifySeparateTestWindowToDetectPageLoads = function(windowObject) {
    // Since the unload event doesn't fire in Safari 1.3, we start polling immediately
    if (!windowObject) {
        console.log("modifySeparateTestWindowToDetectPageLoads: no windowObject!");
        return;
    }
    if (this._windowClosed(windowObject)) {
        console.log("modifySeparateTestWindowToDetectPageLoads: windowObject was closed");
        return;
    }
    var oldMarker = this.isPollingForLoad(windowObject);
    if (oldMarker) {
        console.log("modifySeparateTestWindowToDetectPageLoads: already polling this window: " + oldMarker);
        return;
    }

    var marker = 'selenium' + new Date().getTime();
    console.log("Starting pollForLoad (" + marker + "): " + windowObject.location);
    this.pollingForLoad[marker] = true;
    // if this is a frame, add a load listener, otherwise, attach a poller
    var frameElement = this._getFrameElement(windowObject);
    // DGF HTA mode can't attach load listeners to subframes (yuk!)
    var htaSubFrame = this._isHTASubFrame(windowObject);
    if (frameElement && !htaSubFrame) {
        console.log("modifySeparateTestWindowToDetectPageLoads: this window is a frame; attaching a load listener");
        addLoadListener(frameElement, this.recordPageLoad);
        frameElement[marker] = true;
        frameElement["frame"+this.uniqueId] = marker;
	console.log("dgf this.uniqueId="+this.uniqueId);
	console.log("dgf marker="+marker);
	console.log("dgf frameElement['frame'+this.uniqueId]="+frameElement['frame'+this.uniqueId]);
frameElement[this.uniqueId] = marker;
console.log("dgf frameElement[this.uniqueId]="+frameElement[this.uniqueId]);
    } else {
        windowObject.location[marker] = true;
        windowObject[this.uniqueId] = marker;
        this.pollForLoad(this.recordPageLoad, windowObject, windowObject.document, windowObject.location, windowObject.location.href, marker);
    }
};

BrowserBot.prototype._isHTASubFrame = function(win) {
    if (!browserVersion.isHTA) return false;
    // DGF this is wrong! what if "win" isn't the selected window?
    return this.isSubFrameSelected;
};

BrowserBot.prototype._getFrameElement = function(win) {
    var frameElement = null;
    var caught;
    try {
        frameElement = win.frameElement;
    } catch (e) {
        caught = true;
    }
    if (caught) {
        // on IE, checking frameElement in a pop-up results in a "No such interface supported" exception
        // but it might have a frame element anyway!
        var parentContainsIdenticallyNamedFrame = false;
        try {
            parentContainsIdenticallyNamedFrame = win.parent.frames[win.name];
        } catch (e) {} // this may fail if access is denied to the parent; in that case, assume it's not a pop-up

        if (parentContainsIdenticallyNamedFrame) {
            // it can't be a coincidence that the parent has a frame with the same name as myself!
            var result;
            try {
                result = parentContainsIdenticallyNamedFrame.frameElement;
                if (result) {
                    return result;
                }
            } catch (e) {} // it was worth a try! _getFrameElementsByName is often slow
            result = this._getFrameElementByName(win.name, win.parent.document, win);
            return result;
        }
    }
    console.log("_getFrameElement: frameElement="+frameElement); 
    if (frameElement) {
        console.log("frameElement.name="+frameElement.name);
    }
    return frameElement;
};

BrowserBot.prototype._getFrameElementByName = function(name, doc, win) {
    var frames;
    var frame;
    var i;
    frames = doc.getElementsByTagName("iframe");
    for (i = 0; i < frames.length; i++) {
        frame = frames[i];        
        if (frame.name === name) {
            return frame;
        }
    }
    frames = doc.getElementsByTagName("frame");
    for (i = 0; i < frames.length; i++) {
        frame = frames[i];        
        if (frame.name === name) {
            return frame;
        }
    }
    // DGF weird; we only call this function when we know the doc contains the frame
    console.log("_getFrameElementByName couldn't find a frame or iframe; checking every element for the name " + name);
    return BrowserBot.prototype.locateElementByName(win.name, win.parent.document);
};
    

/**
 * Set up a polling timer that will keep checking the readyState of the document until it's complete.
 * Since we might call this before the original page is unloaded, we first check to see that the current location
 * or href is different from the original one.
 */
BrowserBot.prototype.pollForLoad = function(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker) {
    console.log("pollForLoad original (" + marker + "): " + originalHref);
    try {
        //Samit: Fix: open command sometimes fails if current url is chrome and new is not
        if (this._windowClosed(windowObject)) {
            console.log("pollForLoad WINDOW CLOSED (" + marker + ")");
            delete this.pollingForLoad[marker];
            return;
        }

        var isSamePage = this._isSamePage(windowObject, originalDocument, originalLocation, originalHref, marker);
        var rs = this.getReadyState(windowObject, windowObject.document);

        if (!isSamePage && rs == 'complete') {
            var currentHref = windowObject.location.href;
            console.log("pollForLoad FINISHED (" + marker + "): " + rs + " (" + currentHref + ")");
            delete this.pollingForLoad[marker];
            this._modifyWindow(windowObject);
            var newMarker = this.isPollingForLoad(windowObject);
            if (!newMarker) {
                console.log("modifyWindow didn't start new poller: " + newMarker);
                this.modifySeparateTestWindowToDetectPageLoads(windowObject);
            }
            newMarker = this.isPollingForLoad(windowObject);
            var currentlySelectedWindow;
            var currentlySelectedWindowMarker;
            currentlySelectedWindow =this.getCurrentWindow(true);
            currentlySelectedWindowMarker = currentlySelectedWindow[this.uniqueId];

            console.log("pollForLoad (" + marker + ") restarting " + newMarker);
            if (/(TestRunner-splash|Blank)\.html\?start=true$/.test(currentHref)) {
                console.log("pollForLoad Oh, it's just the starting page.  Never mind!");
            } else if (currentlySelectedWindowMarker == newMarker) {
                loadFunction(currentlySelectedWindow);
            } else {
                console.log("pollForLoad page load detected in non-current window; ignoring (currentlySelected="+currentlySelectedWindowMarker+", detection in "+newMarker+")");
            }
            return;
        }
        this.reschedulePoller(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker);
    } catch (e) {
        console.log("Exception during pollForLoad; this should get noticed soon (" + e.message + ")!");
        //DGF this is supposed to get logged later; log it at debug just in case
        //console.log(e);
        this.pageLoadError = e;
    }
};

BrowserBot.prototype._isSamePage = function(windowObject, originalDocument, originalLocation, originalHref, marker) {
    var currentDocument = windowObject.document;
    var currentLocation = windowObject.location;
    var currentHref = currentLocation.href;

    var sameDoc = this._isSameDocument(originalDocument, currentDocument);

    var sameLoc = (originalLocation === currentLocation);

    // hash marks don't meant the page has loaded, so we need to strip them off if they exist...
    var currentHash = currentHref.indexOf('#');
    if (currentHash > 0) {
        currentHref = currentHref.substring(0, currentHash);
    }
    var originalHash = originalHref.indexOf('#');
    if (originalHash > 0) {
        originalHref = originalHref.substring(0, originalHash);
    }
    console.log("_isSamePage: currentHref: " + currentHref);
    console.log("_isSamePage: originalHref: " + originalHref);

    var sameHref = (originalHref === currentHref);
    var markedLoc = currentLocation[marker];

    if (browserVersion.isKonqueror || browserVersion.isSafari) {
        // the mark disappears too early on these browsers
        markedLoc = true;
    }

    // since this is some _very_ important logic, especially for PI and multiWindow mode, we should log all these out
    console.log("_isSamePage: sameDoc: " + sameDoc);
    console.log("_isSamePage: sameLoc: " + sameLoc);
    console.log("_isSamePage: sameHref: " + sameHref);
    console.log("_isSamePage: markedLoc: " + markedLoc);

    return sameDoc && sameLoc && sameHref && markedLoc;
};

BrowserBot.prototype._isSameDocument = function(originalDocument, currentDocument) {
    return originalDocument === currentDocument;
};


BrowserBot.prototype.getReadyState = function(windowObject, currentDocument) {
    var rs = currentDocument.readyState;
    if (rs == null) {
       if ((this.buttonWindow!=null && this.buttonWindow.document.readyState == null) // not proxy injection mode (and therefore buttonWindow isn't null)
       || (top.document.readyState == null)) {                                               // proxy injection mode (and therefore everything's in the top window, but buttonWindow doesn't exist)
            // uh oh!  we're probably on Firefox with no readyState extension installed!
            // We'll have to just take a guess as to when the document is loaded; this guess
            // will never be perfect. :-(
            if (typeof currentDocument.getElementsByTagName != 'undefined'
                    && typeof currentDocument.getElementById != 'undefined'
                    && ( currentDocument.getElementsByTagName('body')[0] != null
                    || currentDocument.body != null )) {
                if (windowObject.frameElement && windowObject.location.href == "about:blank" && windowObject.frameElement.src != "about:blank") {
                    console.log("getReadyState not loaded, frame location was about:blank, but frame src = " + windowObject.frameElement.src);
                    return null;
                }
                console.log("getReadyState = windowObject.frames.length = " + windowObject.frames.length);
                for (var i = 0; i < windowObject.frames.length; i++) {
                    console.log("i = " + i);
                    if (this.getReadyState(windowObject.frames[i], windowObject.frames[i].document) != 'complete') {
                        console.log("getReadyState aha! the nested frame " + windowObject.frames[i].name + " wasn't ready!");
                        return null;
                    }
                }

                rs = 'complete';
            } else {
                console.log("pollForLoad readyState was null and DOM appeared to not be ready yet");
            }
        }
    }
    else if (rs == "loading" && browserVersion.isIE) {
        console.log("pageUnloading = true!!!!");
        this.pageUnloading = true;
    }
    console.log("getReadyState returning " + rs);
    return rs;
};

BrowserBot.prototype.reschedulePoller = function(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker) {
    var self = this;
    var pollerFunction = function() {
        self.pollForLoad(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker);
    };
    this.windowPollers.push(pollerFunction);
};

BrowserBot.prototype.runScheduledPollers = function() {
    console.log("runScheduledPollers");
    var oldPollers = this.windowPollers;
    this.windowPollers = [];
    for (var i = 0; i < oldPollers.length; i++) {
        oldPollers[i].call();
    }
    console.log("runScheduledPollers DONE");
};

BrowserBot.prototype.isPollingForLoad = function(win) {
    var marker;
    var frameElement = this._getFrameElement(win);
    var htaSubFrame = this._isHTASubFrame(win);
    if (frameElement && !htaSubFrame) {
	marker = frameElement["frame"+this.uniqueId];
    } else {
        marker = win[this.uniqueId];
    }
    if (!marker) {
        console.log("isPollingForLoad false, missing uniqueId " + this.uniqueId + ": " + marker);
        return false;
    }
    if (!this.pollingForLoad[marker]) {
        console.log("isPollingForLoad false, this.pollingForLoad[" + marker + "]: " + this.pollingForLoad[marker]);
        return false;
    }
    return marker;
};

BrowserBot.prototype.getCurrentWindow = function(doNotModify) {
    if (this.proxyInjectionMode) {
        return window;
    }
    var testWindow = this.currentWindow;
    if (!doNotModify) {
        this._modifyWindow(testWindow);
        console.log("getCurrentWindow newPageLoaded = false");
        this.newPageLoaded = false;
    }
    testWindow = this._handleClosedSubFrame(testWindow, doNotModify);
    bot.window_ = testWindow;
    return testWindow;
};

BrowserBot.prototype._handleClosedSubFrame = function(testWindow, doNotModify) {
    if (this.proxyInjectionMode) {
        return testWindow;
    }

    if (this.isSubFrameSelected) {
        var missing = true;
        if (testWindow.parent && testWindow.parent.frames && testWindow.parent.frames.length) {
            for (var i = 0; i < testWindow.parent.frames.length; i++) {
                var frame = testWindow.parent.frames[i];
                if (frame == testWindow || frame.seleniumKey == testWindow.seleniumKey) {
                    missing = false;
                    break;
                }
            }
        }
        if (missing) {
            console.log("Current subframe appears to have closed; selecting top frame");
            this.selectFrame("relative=top");
            return this.getCurrentWindow(doNotModify);
        }
    } else if (this._windowClosed(testWindow)) {
        var closedError = new SeleniumError("Current window or frame is closed!");
        closedError.windowClosed = true;
        throw closedError;
    }
    return testWindow;
};

BrowserBot.prototype.highlight = function (element, force) {
    if (force || this.shouldHighlightLocatedElement) {
        try {
            highlight(element);
        } catch (e) {} // DGF element highlighting is low-priority and possibly dangerous
    }
    return element;
};

BrowserBot.prototype.setShouldHighlightElement = function (shouldHighlight) {
    this.shouldHighlightLocatedElement = shouldHighlight;
};

/*****************************************************************/
/* BROWSER-SPECIFIC FUNCTIONS ONLY AFTER THIS LINE */


BrowserBot.prototype._registerAllLocatorFunctions = function() {
    // TODO - don't do this in the constructor - only needed once ever
    this.locationStrategies = {};
    for (var functionName in this) {
        var result = /^locateElementBy([A-Z].+)$/.exec(functionName);
        if (result != null) {
            var locatorFunction = this[functionName];
            if (typeof(locatorFunction) != 'function') {
                continue;
            }
            // Use a specified prefix in preference to one generated from
            // the function name
            var locatorPrefix = locatorFunction.prefix || result[1].toLowerCase();
            this.locationStrategies[locatorPrefix] = locatorFunction;
        }
    }

    /**
     * Find a locator based on a prefix.
     */
    this.findElementBy = function(locatorType, locator, inDocument, inWindow) {
        var locatorFunction = this.locationStrategies[locatorType];
        if (! locatorFunction) {
            throw new SeleniumError("Unrecognised locator type: '" + locatorType + "'");
        }
        return locatorFunction.call(this, locator, inDocument, inWindow);
    };

    /**
     * The implicit locator, that is used when no prefix is supplied.
     */
    this.locationStrategies.implicit = function(locator, inDocument, inWindow) {
        if (locator.startsWith('//')) {
            return this.locateElementByXPath(locator, inDocument, inWindow);
        }
        if (locator.startsWith('document.')) {
            return this.locateElementByDomTraversal(locator, inDocument, inWindow);
        }
        return this.locateElementByIdentifier(locator, inDocument, inWindow);
    };
};

BrowserBot.prototype.getDocument = function() {
    return this.getCurrentWindow().document;
};

BrowserBot.prototype.getTitle = function() {
    var t = this.getDocument().title;
    if (typeof(t) == "string") {
        t = t.trim();
    }
    return t;
};

/*
 * Finds an element recursively in frames and nested frames in the specified document, using various lookup protocols
 */
BrowserBot.prototype.findElementRecursive = function(locatorType, locatorString, inDocument, inWindow) {

    var element = this.findElementBy(locatorType, locatorString, inDocument, inWindow);
    if (element != null) {
        return element;
    }

    for (var i = 0; i < inWindow.frames.length; i++) {
        // On some browsers, the document object is undefined for third-party
        // frames.  Make sure the document is valid before continuing.
        if (inWindow.frames[i].document) {
            element = this.findElementRecursive(locatorType, locatorString, inWindow.frames[i].document, inWindow.frames[i]);

            if (element != null) {
                return element;
            }
        }
    }
};

/*
* Finds an element on the current page, using various lookup protocols
*/
BrowserBot.prototype.findElementOrNull = function(locator, win) {
    locator = parse_locator(locator);

    if (win == null) {
        win = this.getCurrentWindow();
    }
    var element = this.findElementRecursive(locator.type, locator.string, win.document, win);
    if (element != null) {
        return this.browserbot.highlight(element);
    }

    // Element was not found by any locator function.
    return null;
};

BrowserBot.prototype.findElement = function(locator, win) {
    var element = this.findElementOrNull(locator, win);
    if (element == null) throw new SeleniumError("Element " + locator + " not found");
    return element;
};

/**
 * In non-IE browsers, getElementById() does not search by name.  Instead, we
 * we search separately by id and name.
 */
BrowserBot.prototype.locateElementByIdentifier = function(identifier, inDocument, inWindow) {
    // HBC - use "this" instead of "BrowserBot.prototype"; otherwise we lose
    // the non-prototype fields of the object!
    return this.locateElementById(identifier, inDocument, inWindow) ||
            BrowserBot.prototype.locateElementByName(identifier, inDocument, inWindow) ||
            null;
};

/**
 * Find the element with id - can't rely on getElementById, coz it returns by name as well in IE..
 */
BrowserBot.prototype.locateElementById = function(identifier, inDocument, inWindow) {
    var element = inDocument.getElementById(identifier);
    if (element && element.getAttribute('id') === identifier) {
        return element;
    }
    else if (browserVersion.isIE || browserVersion.isOpera) {
        // SEL-484
        var elements = inDocument.getElementsByTagName('*');
        
        for (var i = 0, n = elements.length; i < n; ++i) {
            element = elements[i];
            
            if (element.tagName.toLowerCase() == 'form') {
                if (element.attributes.id.nodeValue == identifier) {
                    return element;
                }
            }
            else if (element.getAttribute('id') == identifier) {
                return element;
            }
        }
        
        return null;
    }
    else {
        return null;
    }
};

/**
 * Find an element by name, refined by (optional) element-filter expressions.
 */
BrowserBot.prototype.locateElementByName = function(locator, document, inWindow) {
    var elements = document.getElementsByTagName("*");

    var filters = locator.split(' ');
    filters[0] = 'name=' + filters[0];

    while (filters.length) {
        var filter = filters.shift();
        elements = this.selectElements(filter, elements, 'value');
    }

    if (elements.length > 0) {
        return elements[0];
    }
    return null;
};

/**
 * Finds an element using by evaluating the specfied string.
 */
BrowserBot.prototype.locateElementByDomTraversal = function(domTraversal, document, window) {

    var browserbot = this.browserbot;
    var element = null;
    try {
        element = eval(domTraversal);
    } catch (e) {
        return null;
    }

    if (!element) {
        return null;
    }

    return element;
};

BrowserBot.prototype.locateElementByDomTraversal.prefix = "dom";


BrowserBot.prototype.locateElementByStoredReference = function(locator, document, window) {
  try {
    return core.locators.findElement("stored=" + locator);
  } catch (e) {
    return null;
  }
};
BrowserBot.prototype.locateElementByStoredReference.prefix = "stored";


BrowserBot.prototype.locateElementByWebDriver = function(locator, document, window) {
  try {
    return core.locators.findElement("webdriver=" + locator);
  } catch (e) {
    return null;
  }
};
BrowserBot.prototype.locateElementByWebDriver.prefix = "webdriver";

/**
 * Finds an element identified by the xpath expression. Expressions _must_
 * begin with "//".
 */
BrowserBot.prototype.locateElementByXPath = function(xpath, inDocument, inWindow) {
    return this.xpathEvaluator.selectSingleNode(inDocument, xpath, null,
        inDocument.createNSResolver
          ? inDocument.createNSResolver(inDocument.documentElement)
          : this._namespaceResolver);
};

BrowserBot.prototype._namespaceResolver = function(prefix) {
    if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
        return 'http://www.w3.org/1999/xhtml';
    } else if (prefix == 'mathml') {
        return 'http://www.w3.org/1998/Math/MathML';
    } else if (prefix == 'svg') {
        return 'http://www.w3.org/2000/svg';
    } else {
        throw new Error("Unknown namespace: " + prefix + ".");
    }
};

BrowserBot.prototype.close = function() {
    if (browserVersion.isIE) {
        // fix "do you want to close this window" warning in IE
        // You can only close windows that you have opened.
        // So, let's "open" it.
        try {
            this.topFrame.name=new Date().getTime();
            window.open("", this.topFrame.name, "");
            this.topFrame.close();
            return;
        } catch (e) {}
    }
    if (browserVersion.isChrome || browserVersion.isSafari || browserVersion.isOpera) {
        this.topFrame.close();
    } else {
        this.getCurrentWindow().eval("window.top.close();");
    }
};

BrowserBot.prototype.refresh = function() {
    this.getCurrentWindow().location.reload(true);
};

/**
 * Refine a list of elements using a filter.
 */
BrowserBot.prototype.selectElementsBy = function(filterType, filter, elements) {
    var filterFunction = BrowserBot.filterFunctions[filterType];
    if (! filterFunction) {
        throw new SeleniumError("Unrecognised element-filter type: '" + filterType + "'");
    }

    return filterFunction(filter, elements);
};

BrowserBot.filterFunctions = {};

BrowserBot.filterFunctions.name = function(name, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].name === name) {
            selectedElements.push(elements[i]);
        }
    }
    return selectedElements;
};

BrowserBot.filterFunctions.value = function(value, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].value === value) {
            selectedElements.push(elements[i]);
        }
    }
    return selectedElements;
};

BrowserBot.filterFunctions.index = function(index, elements) {
    index = Number(index);
    if (isNaN(index) || index < 0) {
        throw new SeleniumError("Illegal Index: " + index);
    }
    if (elements.length <= index) {
        throw new SeleniumError("Index out of range: " + index);
    }
    return [elements[index]];
};

BrowserBot.prototype.selectElements = function(filterExpr, elements, defaultFilterType) {

    var filterType = (defaultFilterType || 'value');

    // If there is a filter prefix, use the specified strategy
    var result = filterExpr.match(/^([A-Za-z]+)=(.+)/);
    if (result) {
        filterType = result[1].toLowerCase();
        filterExpr = result[2];
    }

    return this.selectElementsBy(filterType, filterExpr, elements);
};

/**
 * Find an element by class
 */
BrowserBot.prototype.locateElementByClass = function(locator, document) {
    return elementFindFirstMatchingChild(document,
            function(element) {
                return element.className == locator;
            }
            );
};

/**
 * Find an element by alt
 */
BrowserBot.prototype.locateElementByAlt = function(locator, document) {
    return elementFindFirstMatchingChild(document,
            function(element) {
                return element.alt == locator;
            }
            );
};

/*****************************************************************/
/* BROWSER-SPECIFIC FUNCTIONS ONLY AFTER THIS LINE */

function MozillaBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(MozillaBrowserBot.prototype, BrowserBot.prototype);

function KonquerorBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(KonquerorBrowserBot.prototype, BrowserBot.prototype);

KonquerorBrowserBot.prototype._isSameDocument = function(originalDocument, currentDocument) {
    // under Konqueror, there may be this case:
    // originalDocument and currentDocument are different objects
    // while their location are same.
    if (originalDocument) {
        return originalDocument.location == currentDocument.location;
    } else {
        return originalDocument === currentDocument;
    }
};

function SafariBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(SafariBrowserBot.prototype, BrowserBot.prototype);

function OperaBrowserBot(frame) {
    BrowserBot.call(this, frame);
};
objectExtend(OperaBrowserBot.prototype, BrowserBot.prototype);

function IEBrowserBot(frame) {
    BrowserBot.call(this, frame);
};
objectExtend(IEBrowserBot.prototype, BrowserBot.prototype);

IEBrowserBot.prototype._handleClosedSubFrame = function(testWindow, doNotModify) {
    if (this.proxyInjectionMode) {
        return testWindow;
    }

    try {
        testWindow.location.href;
        this.permDenied = 0;
    } catch (e) {
        this.permDenied++;
    }
    if (this._windowClosed(testWindow) || this.permDenied > 4) {
        if (this.isSubFrameSelected) {
            console.log("Current subframe appears to have closed; selecting top frame");
            this.selectFrame("relative=top");
            return this.getCurrentWindow(doNotModify);
        } else {
            var closedError = new SeleniumError("Current window or frame is closed!");
            closedError.windowClosed = true;
            throw closedError;
        }
    }
    return testWindow;
};

IEBrowserBot.prototype.modifyWindowToRecordPopUpDialogs = function(windowToModify, browserBot) {
    BrowserBot.prototype.modifyWindowToRecordPopUpDialogs(windowToModify, browserBot);

    // we will call the previous version of this method from within our own interception
    oldShowModalDialog = windowToModify.showModalDialog;

    windowToModify.showModalDialog = function(url, args, features) {
        // Get relative directory to where TestRunner.html lives
        // A risky assumption is that the user's TestRunner is named TestRunner.html
        var doc_location = document.location.toString();
        var end_of_base_ref = doc_location.indexOf('TestRunner.html');
        var base_ref = doc_location.substring(0, end_of_base_ref);
        var runInterval = '';
        
        // Only set run interval if options is defined
        if (typeof(window.runOptions) != 'undefined') {
            runInterval = "&runInterval=" + runOptions.runInterval;
        }
            
        var testRunnerURL = "TestRunner.html?auto=true&singletest=" 
            + escape(browserBot.modalDialogTest)
            + "&autoURL=" 
            + escape(url) 
            + runInterval;
        var fullURL = base_ref + testRunnerURL;
        browserBot.modalDialogTest = null;

        // If using proxy injection mode
        if (this.proxyInjectionMode) {
            var sessionId = runOptions.getSessionId();
            if (sessionId == undefined) {
                sessionId = injectedSessionId;
            }
            if (sessionId != undefined) {
                console.log("Invoking showModalDialog and injecting URL " + fullURL);
            }
            fullURL = url;
        }
        var returnValue = oldShowModalDialog(fullURL, args, features);
        return returnValue;
    };
};

IEBrowserBot.prototype.modifySeparateTestWindowToDetectPageLoads = function(windowObject) {
    this.pageUnloading = false;
    var self = this;
    var pageUnloadDetector = function() {
        self.pageUnloading = true;
    };
    if (windowObject.addEventListener) {
      windowObject.addEventListener('beforeunload', pageUnloadDetector, true);
    } else {
      windowObject.attachEvent('onbeforeunload', pageUnloadDetector);
    }
    BrowserBot.prototype.modifySeparateTestWindowToDetectPageLoads.call(this, windowObject);
};

IEBrowserBot.prototype.pollForLoad = function(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker) {
    console.log("IEBrowserBot.pollForLoad: " + marker);
    if (!this.permDeniedCount[marker]) this.permDeniedCount[marker] = 0;
    BrowserBot.prototype.pollForLoad.call(this, loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker);
    var self;
    if (this.pageLoadError) {
        if (this.pageUnloading) {
            self = this;
            console.log("pollForLoad UNLOADING (" + marker + "): caught exception while firing events on unloading page: " + this.pageLoadError.message);
            this.reschedulePoller(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker);
            this.pageLoadError = null;
            return;
        } else if (((this.pageLoadError.message == "Permission denied") || (/^Access is denied/.test(this.pageLoadError.message)))
                && this.permDeniedCount[marker]++ < 8) {
            if (this.permDeniedCount[marker] > 4) {
                var canAccessThisWindow;
                var canAccessCurrentlySelectedWindow;
                try {
                    windowObject.location.href;
                    canAccessThisWindow = true;
                } catch (e) {}
                try {
                    this.getCurrentWindow(true).location.href;
                    canAccessCurrentlySelectedWindow = true;
                } catch (e) {}
                if (canAccessCurrentlySelectedWindow & !canAccessThisWindow) {
                    console.log("pollForLoad (" + marker + ") ABORTING: " + this.pageLoadError.message + " (" + this.permDeniedCount[marker] + "), but the currently selected window is fine");
                    // returning without rescheduling
                    this.pageLoadError = null;
                    return;
                }
            }

            self = this;
            console.log("pollForLoad (" + marker + "): " + this.pageLoadError.message + " (" + this.permDeniedCount[marker] + "), waiting to see if it goes away");
            this.reschedulePoller(loadFunction, windowObject, originalDocument, originalLocation, originalHref, marker);
            this.pageLoadError = null;
            return;
        }
        //handy for debugging!
        //throw this.pageLoadError;
    }
};

IEBrowserBot.prototype._windowClosed = function(win) {
    try {
        var c = win.closed;
        // frame windows claim to be non-closed when their parents are closed
        // but you can't access their document objects in that case
        if (!c) {
            try {
                win.document;
            } catch (de) {
                if (de.message == "Permission denied") {
                    // the window is probably unloading, which means it's probably not closed yet
                    return false;
                }
                else if (/^Access is denied/.test(de.message)) {
                    // rare variation on "Permission denied"?
                    console.log("IEBrowserBot.windowClosed: got " + de.message + " (this.pageUnloading=" + this.pageUnloading + "); assuming window is unloading, probably not closed yet");
                    return false;
                } else {
                    // this is probably one of those frame window situations
                    console.log("IEBrowserBot.windowClosed: couldn't read win.document, assume closed: " + de.message + " (this.pageUnloading=" + this.pageUnloading + ")");
                    return true;
                }
            }
        }
        if (c == null) {
            console.log("IEBrowserBot.windowClosed: win.closed was null, assuming closed");
            return true;
        }
        return c;
    } catch (e) {
        console.log("IEBrowserBot._windowClosed: Got an exception trying to read win.closed; we'll have to take a guess!");

        if (browserVersion.isHTA) {
            if (e.message == "Permission denied") {
                // the window is probably unloading, which means it's not closed yet
                return false;
            } else {
                // there's a good chance that we've lost contact with the window object if it is closed
                return true;
            }
        } else {
            // the window is probably unloading, which means it's not closed yet
            return false;
        }
    }
};

/**
 * In IE, getElementById() also searches by name - this is an optimisation for IE.
 */
IEBrowserBot.prototype.locateElementByIdentifer = function(identifier, inDocument, inWindow) {
    return inDocument.getElementById(identifier);
};

SafariBrowserBot.prototype.modifyWindowToRecordPopUpDialogs = function(windowToModify, browserBot) {
    BrowserBot.prototype.modifyWindowToRecordPopUpDialogs(windowToModify, browserBot);

    var originalOpen = windowToModify.open;
    /*
     * Safari seems to be broken, so that when we manually trigger the onclick method
     * of a button/href, any window.open calls aren't resolved relative to the app location.
     * So here we replace the open() method with one that does resolve the url correctly.
     */
    windowToModify.open = function(url, windowName, windowFeatures, replaceFlag) {

        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
            return originalOpen(url, windowName, windowFeatures, replaceFlag);
        }

        // Reduce the current path to the directory
        var currentPath = windowToModify.location.pathname || "/";
        currentPath = currentPath.replace(/\/[^\/]*$/, "/");

        // Remove any leading "./" from the new url.
        url = url.replace(/^\.\//, "");

        newUrl = currentPath + url;

        var openedWindow = originalOpen(newUrl, windowName, windowFeatures, replaceFlag);
        console.log("window.open call intercepted; window ID (which you can use with selectWindow()) is \"" +  windowName + "\"");
        if (windowName!=null) {
            openedWindow["seleniumWindowName"] = windowName;
        }
        return openedWindow;
    };
};

SafariBrowserBot.prototype.refresh = function() {
    var win = this.getCurrentWindow();
    if (win.location.hash) {
        // DGF Safari refuses to refresh when there's a hash symbol in the URL
        win.location.hash = "";
        var actuallyReload = function() {
            win.location.reload(true);
        };
        window.setTimeout(actuallyReload, 1);
    } else {
        win.location.reload(true);
    }
};
