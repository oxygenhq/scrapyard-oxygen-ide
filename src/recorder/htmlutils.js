/*
 * Copyright 2011 Software Freedom Conservancy
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */

// This script contains a badly-organised collection of miscellaneous functions that really better homes.

function classCreate() {
    return function() {
      this.initialize.apply(this, arguments);
    }
}

function objectExtend(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

function elementSetStyle(element, style) {
    for (var name in style) {
      var value = style[name];
      if (value == null) value = "";
      element.style[name] = value;
    }
}

function elementGetStyle(element, style) {
    var value = element.style[style];
    if (!value) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css.getPropertyValue(style) : null;
      } else if (element.currentStyle) {
        value = element.currentStyle[style];
      }
    }

    /** DGF necessary? 
    if (window.opera && ['left', 'top', 'right', 'bottom'].include(style))
      if (Element.getStyle(element, 'position') == 'static') value = 'auto'; */

    return value == 'auto' ? null : value;
  }

/**
 * Given a string literal that would appear in an XPath, puts it in quotes and
 * returns it. Special consideration is given to literals who themselves
 * contain quotes. It's possible for a concat() expression to be returned.
 */
String.prototype.quoteForXPath = function()
{
    if (/\'/.test(this)) {
        if (/\"/.test(this)) {
            // concat scenario
            var pieces = [];
            var a = "'", b = '"', c;
            for (var i = 0, j = 0; i < this.length;) {
                if (this.charAt(i) == a) {
                    // encountered a quote that cannot be contained in current
                    // quote, so need to flip-flop quoting scheme
                    if (j < i) {
                        pieces.push(a + this.substring(j, i) + a);
                        j = i;
                    }
                    c = a;
                    a = b;
                    b = c;
                }
                else {
                    ++i;
                }
            }
            pieces.push(a + this.substring(j) + a);
            return 'concat(' + pieces.join(', ') + ')';
        }
        else {
            // quote with doubles
            return '"' + this + '"';
        }
    }
    // quote with singles
    return "'" + this + "'";
};

// Returns the text in this element
function getText(element) {
    var text = "";

    var isRecentFirefox = (browserVersion.isFirefox && browserVersion.firefoxVersion >= "1.5");
    if (isRecentFirefox || browserVersion.isKonqueror || browserVersion.isSafari || browserVersion.isOpera) {
        text = getTextContent(element);
    } else if (element.textContent) {
        text = element.textContent;
    } else if (element.innerText) {
        text = element.innerText;
    }

    text = normalizeNewlines(text);
    text = normalizeSpaces(text);

    return text.trim();
}

function getTextContent(element, preformatted) {
    if (element.style && (element.style.visibility == 'hidden' || element.style.display == 'none')) return '';
    if (element.nodeType == 3 /*Node.TEXT_NODE*/) {
        var text = element.data;
        if (!preformatted) {
            text = text.replace(/\n|\r|\t/g, " ");
        }
        return text;
    }
    if (element.nodeType == 1 /*Node.ELEMENT_NODE*/ && element.nodeName != 'SCRIPT') {
        var childrenPreformatted = preformatted || (element.tagName == "PRE");
        var text = "";
        for (var i = 0; i < element.childNodes.length; i++) {
            var child = element.childNodes.item(i);
            text += getTextContent(child, childrenPreformatted);
        }
        // Handle block elements that introduce newlines
        // -- From HTML spec:
        //<!ENTITY % block
        //     "P | %heading; | %list; | %preformatted; | DL | DIV | NOSCRIPT |
        //      BLOCKQUOTE | F:wORM | HR | TABLE | FIELDSET | ADDRESS">
        //
        // TODO: should potentially introduce multiple newlines to separate blocks
        if (element.tagName == "P" || element.tagName == "BR" || element.tagName == "HR" || element.tagName == "DIV") {
            text += "\n";
        }
        return text;
    }
    return '';
}

/**
 * Convert all newlines to \n
 */
function normalizeNewlines(text)
{
    return text.replace(/\r\n|\r/g, "\n");
}

/**
 * Replace multiple sequential spaces with a single space, and then convert &nbsp; to space.
 */
function normalizeSpaces(text)
{
    // IE has already done this conversion, so doing it again will remove multiple nbsp
    if (browserVersion.isIE)
    {
        return text;
    }

    // Replace multiple spaces with a single space
    // TODO - this shouldn't occur inside PRE elements
    text = text.replace(/\ +/g, " ");

    // Replace &nbsp; with a space
    var nbspPattern = new RegExp(String.fromCharCode(160), "g");
    if (browserVersion.isSafari) {
	return replaceAll(text, String.fromCharCode(160), " ");
    } else {
	return text.replace(nbspPattern, " ");
    }
}

function replaceAll(text, oldText, newText) {
    while (text.indexOf(oldText) != -1) {
	text = text.replace(oldText, newText);
    }
    return text;
}

// Sets the text in this element
function setText(element, text) {
    if (element.textContent != null) {
        element.textContent = text;
    } else if (element.innerText != null) {
        element.innerText = text;
    }
}

// Get the value of an <input> element
function getInputValue(inputElement) {
    if (inputElement.type) {
        if (inputElement.type.toUpperCase() == 'CHECKBOX' ||
            inputElement.type.toUpperCase() == 'RADIO')
        {
            return (inputElement.checked ? 'on' : 'off');
        }
    }
    if (inputElement.value == null) {
        throw new SeleniumError("This element has no value; is it really a form field?");
    }
    return inputElement.value;
}

function getKeyCodeFromKeySequence(keySequence) {
    var match = /^\\(\d{1,3})$/.exec(keySequence);
    if (match != null) {
        return match[1];
    }
    match = /^.$/.exec(keySequence);
    if (match != null) {
        return match[0].charCodeAt(0);
    }
    // this is for backward compatibility with existing tests
    // 1 digit ascii codes will break however because they are used for the digit chars
    match = /^\d{2,3}$/.exec(keySequence);
    if (match != null) {
        return match[0];
    }
    throw new SeleniumError("invalid keySequence");
}

function createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
     var evt = element.ownerDocument.createEventObject();
     evt.shiftKey = shiftKeyDown;
     evt.metaKey = metaKeyDown;
     evt.altKey = altKeyDown;
     evt.ctrlKey = controlKeyDown;
     return evt;
}

function triggerKeyEvent(element, eventType, keySequence, canBubble, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
    var keycode = getKeyCodeFromKeySequence(keySequence);
    canBubble = (typeof(canBubble) == undefined) ? true : canBubble;
    if (element.fireEvent && element.ownerDocument && element.ownerDocument.createEventObject) { // IE
        var keyEvent = createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown);
        keyEvent.keyCode = keycode;
        element.fireEvent('on' + eventType, keyEvent);
    }
    else {
        var evt;
        if (window.KeyEvent) {
            var doc = goog.dom.getOwnerDocument(element);
            var view = goog.dom.getWindow(doc);
            evt = doc.createEvent('KeyEvents');
            evt.initKeyEvent(eventType, true, true, view, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown, keycode, keycode);
        } else {
            evt = document.createEvent('UIEvents');
            
            evt.shiftKey = shiftKeyDown;
            evt.metaKey = metaKeyDown;
            evt.altKey = altKeyDown;
            evt.ctrlKey = controlKeyDown;

            evt.initUIEvent(eventType, true, true, window, 1);
            evt.keyCode = keycode;
            evt.which = keycode;
        }

        element.dispatchEvent(evt);
    }
}

function removeLoadListener(element, command) {
    LOG.debug('Removing loadListenter for ' + element + ', ' + command);
    if (window.removeEventListener)
        element.removeEventListener("load", command, true);
    else if (window.detachEvent)
        element.detachEvent("onload", command);
}

function addLoadListener(element, command) {
    LOG.debug('Adding loadListenter for ' + element + ', ' + command);
    var augmentedCommand = function() {
        command.call(this, element);
    }
    if (window.addEventListener && !browserVersion.isOpera)
        element.addEventListener("load", augmentedCommand, true);
    else if (window.attachEvent)
        element.attachEvent("onload", augmentedCommand);
}

/**
 * Override the broken getFunctionName() method from JsUnit
 * This file must be loaded _after_ the jsunitCore.js
 */
function getFunctionName(aFunction) {
    var regexpResult = aFunction.toString().match(/function (\w*)/);
    if (regexpResult && regexpResult[1]) {
        return regexpResult[1];
    }
    return 'anonymous';
}

function getDocumentBase(doc) {
    var bases = document.getElementsByTagName("base");
    if (bases && bases.length && bases[0].href) {
        return bases[0].href;
    }
    return "";
}

function getTagName(element) {
    var tagName;
    if (element && element.tagName && element.tagName.toLowerCase) {
        tagName = element.tagName.toLowerCase();
    }
    return tagName;
}

function selArrayToString(a) {
    if (isArray(a)) {
        // DGF copying the array, because the array-like object may be a non-modifiable nodelist
        var retval = [];
        for (var i = 0; i < a.length; i++) {
            var item = a[i];
            var replaced = new String(item).replace(/([,\\])/g, '\\$1');
            retval[i] = replaced;
        }
        return retval;
    }
    return new String(a);
}
function isArray(x) {
    return ((typeof x) == "object") && (x["length"] != null);
}

function absolutify(url, baseUrl) {
    /** returns a relative url in its absolute form, given by baseUrl.
    * 
    * This function is a little odd, because it can take baseUrls that
    * aren't necessarily directories.  It uses the same rules as the HTML 
    * &lt;base&gt; tag; if the baseUrl doesn't end with "/", we'll assume
    * that it points to a file, and strip the filename off to find its
    * base directory.
    *
    * So absolutify("foo", "http://x/bar") will return "http://x/foo" (stripping off bar),
    * whereas absolutify("foo", "http://x/bar/") will return "http://x/bar/foo" (preserving bar).
    * Naturally absolutify("foo", "http://x") will return "http://x/foo", appropriately.
    * 
    * @param url the url to make absolute; if this url is already absolute, we'll just return that, unchanged
    * @param baseUrl the baseUrl from which we'll absolutify, following the rules above.
    * @return 'url' if it was already absolute, or the absolutized version of url if it was not absolute.
    */
    
    // DGF isn't there some library we could use for this?
        
    if (/^\w+:/.test(url)) {
        // it's already absolute
        return url;
    }
    
    var loc;
    try {
        loc = parseUrl(baseUrl);
    } catch (e) {
        // is it an absolute windows file path? let's play the hero in that case
        if (/^\w:\\/.test(baseUrl)) {
            baseUrl = "file:///" + baseUrl.replace(/\\/g, "/");
            loc = parseUrl(baseUrl);
        } else {
            throw new SeleniumError("baseUrl wasn't absolute: " + baseUrl);
        }
    }
    loc.search = null;
    loc.hash = null;
    
    // if url begins with /, then that's the whole pathname
    if (/^\//.test(url)) {
        loc.pathname = url;
        var result = reassembleLocation(loc);
        return result;
    }
    
    // if pathname is null, then we'll just append "/" + the url
    if (!loc.pathname) {
        loc.pathname = "/" + url;
        var result = reassembleLocation(loc);
        return result;
    }
    
    // if pathname ends with /, just append url
    if (/\/$/.test(loc.pathname)) {
        loc.pathname += url;
        var result = reassembleLocation(loc);
        return result;
    }
    
    // if we're here, then the baseUrl has a pathname, but it doesn't end with /
    // in that case, we replace everything after the final / with the relative url
    loc.pathname = loc.pathname.replace(/[^\/\\]+$/, url);
    var result = reassembleLocation(loc);
    return result;
    
}

var URL_REGEX = /^((\w+):\/\/)(([^:]+):?([^@]+)?@)?([^\/\?:]*):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(.+)?/;

function parseUrl(url) {
    var fields = ['url', null, 'protocol', null, 'username', 'password', 'host', 'port', 'pathname', 'search', 'hash'];
    var result = URL_REGEX.exec(url);
    if (!result) {
        throw new SeleniumError("Invalid URL: " + url);
    }
    var loc = new Object();
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field == null) {
            continue;
        }
        loc[field] = result[i];
    }
    return loc;
}

function reassembleLocation(loc) {
    if (!loc.protocol) {
        throw new Error("Not a valid location object: " + o2s(loc));
    }
    var protocol = loc.protocol;
    protocol = protocol.replace(/:$/, "");
    var url = protocol + "://";
    if (loc.username) {
        url += loc.username;
        if (loc.password) {
            url += ":" + loc.password;
        }
        url += "@";
    }
    if (loc.host) {
        url += loc.host;
    }
    
    if (loc.port) {
        url += ":" + loc.port;
    }
    
    if (loc.pathname) {
        url += loc.pathname;
    }
    
    if (loc.search) {
        url += "?" + loc.search;
    }
    if (loc.hash) {
        var hash = loc.hash;
        hash = loc.hash.replace(/^#/, "");
        url += "#" + hash;
    }
    return url;
}

function canonicalize(url) {
    if(url == "about:blank")
    {
	return url;
    }
    var tempLink = window.document.createElement("link");
    tempLink.href = url; // this will canonicalize the href on most browsers
    var loc = parseUrl(tempLink.href)
    if (!/\/\.\.\//.test(loc.pathname)) {
    	return tempLink.href;
    }
  	// didn't work... let's try it the hard way
  	var originalParts = loc.pathname.split("/");
  	var newParts = [];
  	newParts.push(originalParts.shift());
  	for (var i = 0; i < originalParts.length; i++) {
  		var part = originalParts[i];
  		if (".." == part) {
  			newParts.pop();
  			continue;
  		}
  		newParts.push(part);
  	}
  	loc.pathname = newParts.join("/");
    return reassembleLocation(loc);
}

function extractExceptionMessage(ex) {
    if (ex == null) return "null exception";
    if (ex.message != null) return ex.message;
    if (ex.toString && ex.toString() != null) return ex.toString();
}
    

function describe(object, delimiter) {
    var props = new Array();
    for (var prop in object) {
        try {
            props.push(prop + " -> " + object[prop]);
        } catch (e) {
            props.push(prop + " -> [htmlutils: ack! couldn't read this property! (Permission Denied?)]");
        }
    }
    return props.join(delimiter || '\n');
}

var PatternMatcher = function(pattern) {
    this.selectStrategy(pattern);
};
PatternMatcher.prototype = {

    selectStrategy: function(pattern) {
        this.pattern = pattern;
        var strategyName = 'glob';
        // by default
        if (/^([a-z-]+):(.*)/.test(pattern)) {
            var possibleNewStrategyName = RegExp.$1;
            var possibleNewPattern = RegExp.$2;
            if (PatternMatcher.strategies[possibleNewStrategyName]) {
                strategyName = possibleNewStrategyName;
                pattern = possibleNewPattern;
            }
        }
        var matchStrategy = PatternMatcher.strategies[strategyName];
        if (!matchStrategy) {
            throw new SeleniumError("cannot find PatternMatcher.strategies." + strategyName);
        }
        this.strategy = matchStrategy;
        this.matcher = new matchStrategy(pattern);
    },

    matches: function(actual) {
        return this.matcher.matches(actual + '');
        // Note: appending an empty string avoids a Konqueror bug
    }

};

/**
 * A "static" convenience method for easy matching
 */
PatternMatcher.matches = function(pattern, actual) {
    return new PatternMatcher(pattern).matches(actual);
};

PatternMatcher.strategies = {

/**
 * Exact matching, e.g. "exact:***"
 */
    exact: function(expected) {
        this.expected = expected;
        this.matches = function(actual) {
            return actual == this.expected;
        };
    },

/**
 * Match by regular expression, e.g. "regexp:^[0-9]+$"
 */
    regexp: function(regexpString) {
        this.regexp = new RegExp(regexpString);
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },

    regex: function(regexpString) {
        this.regexp = new RegExp(regexpString);
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },
    
    regexpi: function(regexpString) {
        this.regexp = new RegExp(regexpString, "i");
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },

    regexi: function(regexpString) {
        this.regexp = new RegExp(regexpString, "i");
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },

/**
 * "globContains" (aka "wildmat") patterns, e.g. "glob:one,two,*",
 * but don't require a perfect match; instead succeed if actual
 * contains something that matches globString.
 * Making this distinction is motivated by a bug in IE6 which
 * leads to the browser hanging if we implement *TextPresent tests
 * by just matching against a regular expression beginning and
 * ending with ".*".  The globcontains strategy allows us to satisfy
 * the functional needs of the *TextPresent ops more efficiently
 * and so avoid running into this IE6 freeze.
 */
    globContains: function(globString) {
        this.regexp = new RegExp(PatternMatcher.regexpFromGlobContains(globString));
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    },
/**
 * "glob" (aka "wildmat") patterns, e.g. "glob:one,two,*"
 */
    glob: function(globString) {
        this.regexp = new RegExp(PatternMatcher.regexpFromGlob(globString));
        this.matches = function(actual) {
            return this.regexp.test(actual);
        };
    }

};

PatternMatcher.convertGlobMetaCharsToRegexpMetaChars = function(glob) {
    var re = glob;
    re = re.replace(/([.^$+(){}\[\]\\|])/g, "\\$1");
    re = re.replace(/\?/g, "(.|[\r\n])");
    re = re.replace(/\*/g, "(.|[\r\n])*");
    return re;
};

PatternMatcher.regexpFromGlobContains = function(globContains) {
    return PatternMatcher.convertGlobMetaCharsToRegexpMetaChars(globContains);
};

PatternMatcher.regexpFromGlob = function(glob) {
    return "^" + PatternMatcher.convertGlobMetaCharsToRegexpMetaChars(glob) + "$";
};

if (!this["Assert"]) Assert = {};
Assert.fail = function(message) {
    throw new AssertionFailedError(message);
};

/*
* Assert.equals(comment?, expected, actual)
*/
Assert.equals = function() {
    var args = new AssertionArguments(arguments);
    if (args.expected === args.actual) {
        return;
    }
    Assert.fail(args.comment +
                "Expected '" + args.expected +
                "' but was '" + args.actual + "'");
};

Assert.assertEquals = Assert.equals;

/*
* Assert.matches(comment?, pattern, actual)
*/
Assert.matches = function() {
    var args = new AssertionArguments(arguments);
    if (PatternMatcher.matches(args.expected, args.actual)) {
        return;
    }
    Assert.fail(args.comment +
                "Actual value '" + args.actual +
                "' did not match '" + args.expected + "'");
}

/*
* Assert.notMtches(comment?, pattern, actual)
*/
Assert.notMatches = function() {
    var args = new AssertionArguments(arguments);
    if (!PatternMatcher.matches(args.expected, args.actual)) {
        return;
    }
    Assert.fail(args.comment +
                "Actual value '" + args.actual +
                "' did match '" + args.expected + "'");
}
// Preprocess the arguments to allow for an optional comment.
function AssertionArguments(args) {
    if (args.length == 2) {
        this.comment = "";
        this.expected = args[0];
        this.actual = args[1];
    } else {
        this.comment = args[0] + "; ";
        this.expected = args[1];
        this.actual = args[2];
    }
}

function AssertionFailedError(message) {
    this.isAssertionFailedError = true;
    this.isSeleniumError = true;
    this.message = message;
    this.failureMessage = message;
}

function SeleniumError(message) {
    var error = new Error(message);
    if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
        var result = '';
        for (var a = arguments.caller; a != null; a = a.caller) {
            result += '> ' + a.callee.toString() + '\n';
            if (a.caller == a) {
                result += '*';
                break;
            }
        }
        error.stack = result;
    }
    error.isSeleniumError = true;
    return error;
}

function highlight(element) {
    var highLightColor = "yellow";
    var outline = "#8f8 solid 1px"  //Samit: Enh: Added an outline to simulate the native find button behaviour

    if (element.originalColor == undefined) { // avoid picking up highlight
        element.originalColor = elementGetStyle(element, "background-color");
    }
    if (element.originalOutline == undefined) { // avoid picking up highlight
        element.originalOutline = elementGetStyle(element, "outline");
    }
    elementSetStyle(element, {"backgroundColor" : highLightColor});
    elementSetStyle(element, {"outline" : outline});
    window.setTimeout(function() {
        try {
            //if element is orphan, probably page of it has already gone, so ignore
            if (!element.parentNode) {
                return;
            }
            elementSetStyle(element, {"backgroundColor" : element.originalColor});
            elementSetStyle(element, {"outline" : element.originalOutline});
        } catch (e) {} // DGF unhighlighting is very dangerous and low priority
    }, 200);
}
// for use from vs.2003 debugger
function o2s(obj) {
    var s = "";
    for (key in obj) {
        var line = key + "->" + obj[key];
        line.replace("\n", " ");
        s += line + "\n";
    }
    return s;
}

var seenReadyStateWarning = false;

function openSeparateApplicationWindow(url, suppressMozillaWarning) {
    // resize the Selenium window itself
    window.resizeTo(1200, 500);
    window.moveTo(window.screenX, 0);

    var appWindow = window.open(url + '?start=true', 'selenium_main_app_window');
    if (appWindow == null) {
        var errorMessage = "Couldn't open app window; is the pop-up blocker enabled?";
        LOG.error(errorMessage);
        throw new Error(errorMessage);
    }
    try {
        var windowHeight = 500;
        if (window.outerHeight) {
            windowHeight = window.outerHeight;
        } else if (document.documentElement && document.documentElement.offsetHeight) {
            windowHeight = document.documentElement.offsetHeight;
        }

        if (window.screenLeft && !window.screenX) window.screenX = window.screenLeft;
        if (window.screenTop && !window.screenY) window.screenY = window.screenTop;

        appWindow.resizeTo(1200, screen.availHeight - windowHeight - 60);
        appWindow.moveTo(window.screenX, window.screenY + windowHeight + 25);
    } catch (e) {
        LOG.error("Couldn't resize app window");
        LOG.exception(e);
    }
    if (!suppressMozillaWarning && window.document.readyState == null && !seenReadyStateWarning) {
        alert("Beware!  Mozilla bug 300992 means that we can't always reliably detect when a new page has loaded.  Install the Selenium IDE extension or the readyState extension available from selenium.openqa.org to make page load detection more reliable.");
        seenReadyStateWarning = true;
    }

    return appWindow;
}

var URLConfiguration = classCreate();
objectExtend(URLConfiguration.prototype, {
    initialize: function() {
    },
    _isQueryParameterTrue: function (name) {
        var parameterValue = this._getQueryParameter(name);
        if (parameterValue == null) return false;
        if (parameterValue.toLowerCase() == "true") return true;
        if (parameterValue.toLowerCase() == "on") return true;
        return false;
    },

    _getQueryParameter: function(searchKey) {
        var str = this.queryString
        if (str == null) return null;
        var clauses = str.split('&');
        for (var i = 0; i < clauses.length; i++) {
            var keyValuePair = clauses[i].split('=', 2);
            var key = unescape(keyValuePair[0]);
            if (key == searchKey) {
                return unescape(keyValuePair[1]);
            }
        }
        return null;
    },

    isMultiWindowMode:function() {
        return this._isQueryParameterTrue('multiWindow');
    },
    
    getBaseUrl:function() {
        return this._getQueryParameter('baseUrl');
            
    }
});
function safeScrollIntoView(element) {
    if (element.scrollIntoView) {
        element.scrollIntoView(false);
        return;
    }
    // TODO: work out how to scroll browsers that don't support
    // scrollIntoView (like Konqueror)
}

/**
 * Returns the absolute time represented as an offset of the current time.
 * Throws a SeleniumException if timeout is invalid.
 *
 * @param timeout  the number of milliseconds from "now" whose absolute time
 *                 to return
 */
function getTimeoutTime(timeout) {
    var now = new Date().getTime();
    var timeoutLength = parseInt(timeout);
    
    if (isNaN(timeoutLength)) {
        throw new SeleniumError("Timeout is not a number: '" + timeout + "'");
    }
    
    return now + timeoutLength;
}

/**
 * Returns true iff the current environment is the IDE, and is not the chrome
 * runner launched by the IDE.
 */
function is_IDE() {
    var locstr = window.location.href;
    
    if (locstr.indexOf('chrome://selenium-ide-testrunner') == 0) {
         return false;
    }
    
    return (typeof(SeleniumIDE) != 'undefined');
}

/**
 * Logs a message if the Logger exists, and does nothing if it doesn't exist.
 *
 * @param level  the level to log at
 * @param msg    the message to log
 */
function safe_log(level, msg)
{
    try {
        LOG[level](msg);
    }
    catch (e) {
        // couldn't log!
    }
}

/**
 * Displays a warning message to the user appropriate to the context under
 * which the issue is encountered. This is primarily used to avoid popping up
 * alert dialogs that might pause an automated test suite.
 *
 * @param msg  the warning message to display
 */
function safe_alert(msg)
{
    if (is_IDE()) {
        alert(msg);
    }
}

/**
 * Returns true iff the given element represents a link with a javascript
 * href attribute, and does not have an onclick attribute defined.
 *
 * @param element  the element to test
 */
function hasJavascriptHref(element) {
    if (getTagName(element) != 'a') {
        return false;
    }
    if (element.getAttribute('onclick')) {
        return false;
    }
    if (! element.href) {
        return false;
    }
    if (! /\s*javascript:/i.test(element.href)) {
        return false;
    }
    return true;
}

/**
 * Returns the given element, or its nearest ancestor, that satisfies
 * hasJavascriptHref(). Returns null if none is found.
 *
 * @param element  the element whose ancestors to test
 */
function getAncestorOrSelfWithJavascriptHref(element) {
    if (hasJavascriptHref(element)) {
        return element;
    }
    if (element.parentNode == null) {
        return null;
    }
    return getAncestorOrSelfWithJavascriptHref(element.parentNode);
}

//******************************************************************************
// Locator evaluation support

/**
 * Parses a Selenium locator, returning its type and the unprefixed locator
 * string as an object.
 *
 * @param locator  the locator to parse
 */
function parse_locator(locator)
{
    var result = locator.match(/^([A-Za-z]+)=.+/);
    if (result) {
        var type = result[1].toLowerCase();
        var actualLocator = locator.substring(type.length + 1);
        return { type: type, string: actualLocator };
    }
    return { type: 'implicit', string: locator };
}

/**
 * An interface definition for XPath engine implementations; an instance of
 * XPathEngine should be their prototype. Sub-implementations need only define
 * overrides of the methods provided here.
 */
function XPathEngine() {
// public
    this.doc = null;

    /**
     * Returns whether the current runtime environment supports the use of this
     * engine. Needs override.
     */
    this.isAvailable = function() { return false; };
    
    /**
     * Sets the document to be used for evaluation. Always returns the current
     * engine object so as to be chainable.
     */
    this.setDocument = function(newDocument) {
        this.doc = newDocument;
        return this;
    };

    /**
     * Returns a possibly-empty list of nodes. Needs override.
     */
    this.selectNodes = function(xpath, contextNode, namespaceResolver) {
        return [];
    };
    
    /**
     * Returns a single node, or null if no nodes were selected. This default
     * implementation simply returns the first result of selectNodes(), or
     * null.
     */
    this.selectSingleNode = function(xpath, contextNode, namespaceResolver) {
        var nodes = this.selectNodes(xpath, contextNode, namespaceResolver);
        return (nodes.length > 0 ? nodes[0] : null);
    };
    
    /**
     * Returns the number of matching nodes. This default implementation simply
     * returns the length of the result of selectNodes(), which should be
     * adequate for most sub-implementations.
     */
    this.countNodes = function(xpath, contextNode, namespaceResolver) {
        return this.selectNodes(xpath, contextNode, namespaceResolver).length;
    };
    
    /**
     * An optimization; likely to be a no-op for many implementations. Always
     * returns the current engine object so as to be chainable.
     */
    this.setIgnoreAttributesWithoutValue = function(ignore) { return this; };
}

/**
 * Implements XPathEngine.
 */
function NativeEngine() {
// public
    // Override
    this.isAvailable = function() {
        if (browserVersion && browserVersion.isIE) {
            // javascript-xpath can fake out the check otherwise
            return false;
        }
    
        return this.doc && this.doc.evaluate;
    };
    
    // Override
    this.selectNodes = function(xpath, contextNode, namespaceResolver) {
        if (contextNode != this.doc) {
            xpath = '.' + xpath;
        }
    
        var nodes = [];
        
        try {
            var xpathResult = this.doc.evaluate(xpath, contextNode,
                namespaceResolver, 0, null);
        }
        catch (e) {
            var msg = extractExceptionMessage(e);
            throw new SeleniumError("Invalid xpath [1]: " + msg);
        }
        finally {
            if (xpathResult == null) {
                // If the result is null, we should still throw an Error.
                throw new SeleniumError("Invalid xpath [2]: " + xpath); 
            }
        }
        
        var node = xpathResult.iterateNext();
        
        while (node) {
            nodes.push(node);
            node = xpathResult.iterateNext();
        }
        
        return nodes;
    };
}

NativeEngine.prototype = new XPathEngine();

/**
 * Implements XPathEngine.
 */
function AjaxsltEngine() {
// private
    var ignoreAttributesWithoutValue = false;
    
    function selectLogic(xpath, contextNode, namespaceResolver, firstMatch) {
        // DGF set xpathdebug = true (using getEval, if you like) to turn on JS
        // XPath debugging
        //xpathdebug = true;
        var context;
        
        if (contextNode == this.doc) {
            context = new ExprContext(this.doc);
        }
        else {
            // provide false values to get the default constructor values
            context = new ExprContext(contextNode, false, false,
                contextNode.parentNode);
        }
        
        context.setCaseInsensitive(true);
        context.setIgnoreAttributesWithoutValue(ignoreAttributesWithoutValue);
        context.setReturnOnFirstMatch(firstMatch);
        
        try {
            var xpathObj = xpathParse(xpath);
        }
        catch (e) {
            var msg = extractExceptionMessage(e);
            throw new SeleniumError("Invalid xpath [3]: " + msg);
        }
        
        var nodes = []
        var xpathResult = xpathObj.evaluate(context);
        
        if (xpathResult && xpathResult.value) {
            for (var i = 0; i < xpathResult.value.length; ++i) {
                nodes.push(xpathResult.value[i]);
            }
        }
        
        return nodes;
    }
    
// public
    // Override
    this.isAvailable = function() { return true; };
    
    // Override
    this.selectNodes = function(xpath, contextNode, namespaceResolver) {
        return selectLogic(xpath, contextNode, namespaceResolver, false);
    };
    
    // Override
    this.selectSingleNode = function(xpath, contextNode, namespaceResolver) {
        var nodes = selectLogic(xpath, contextNode, namespaceResolver, true);
        return (nodes.length > 0 ? nodes[0] : null);
    };
    
    // Override
    this.setIgnoreAttributesWithoutValue = function(ignore) {
        ignoreAttributesWithoutValue = ignore;
        return this;
    };
}

AjaxsltEngine.prototype = new XPathEngine();

/**
 * Implements XPathEngine.
 */
function JavascriptXPathEngine() {
// private
    var engineDoc = document;
    
// public
    // Override
    this.isAvailable = function() { return true; };
    
    // Override
    this.selectNodes = function(xpath, contextNode, namespaceResolver) {
        if (contextNode != this.doc) {
            // Regarding use of the second argument to document.evaluate():
            // http://groups.google.com/group/comp.lang.javascript/browse_thread/thread/a59ce20639c74ba1/a9d9f53e88e5ebb5
            xpath = '.' + xpath;
        }
    
        var nodes = [];
        
        try {
            // When using the new and faster javascript-xpath library, we'll
            // use the TestRunner's document object, not the App-Under-Test's
            // document. The new library only modifies the TestRunner document
            // with the new functionality.
            var xpathResult = engineDoc.evaluate(xpath, contextNode,
                namespaceResolver, 0, null);
        }
        catch (e) {
            var msg = extractExceptionMessage(e);
            throw new SeleniumError("Invalid xpath [1]: " + msg);
        }
        finally {
            if (xpathResult == null) {
                // If the result is null, we should still throw an Error.
                throw new SeleniumError("Invalid xpath [2]: " + xpath); 
            }
        }
        
        var node = xpathResult.iterateNext();
        
        while (node) {
            nodes.push(node);
            node = xpathResult.iterateNext();
        }
        
        return nodes;
    };
}

JavascriptXPathEngine.prototype = new XPathEngine();

/**
 * Cache class.
 *
 * @param newMaxSize  the maximum number of entries to keep in the cache.
 */
function BoundedCache(newMaxSize) {
    var maxSize = newMaxSize;
    var map = {};
    var size = 0;
    var counter = -1;
    
    /**
     * Adds a key-value pair to the cache. If the cache is at its size limit,
     * the least-recently used entry is evicted.
     */
    this.put = function(key, value) {
        if (map[key]) {
            // entry already exists
            map[key] = { usage: ++counter, value: value };
        }
        else {
            map[key] = { usage: ++counter, value: value };
            ++size;
            
            if (size > maxSize) {
                // remove the least recently used item
                var minUsage = counter;
                var keyToRemove = key;
            
                for (var key in map) {
                    if (map[key].usage < minUsage) {
                        minUsage = map[key].usage;
                        keyToRemove = key;
                    }
                }
                
                this.remove(keyToRemove);
            }
        }
    };
    
    /**
     * Returns a cache item by its key, and updates its use status.
     */
    this.get = function(key) {
        if (map[key]) {
            map[key].usage = ++counter;
            return map[key].value;
        }
        
        return null;
    };
    
    /**
     * Removes a cache item by its key.
     */
    this.remove = function(key) {
        if (map[key]) {
            delete map[key];
            --size;
            
            if (size == 0) {
                counter = -1;
            }
        }
    }
    
    /**
     * Clears all entries in the cache.
     */
    this.clear = function() {
        map = {};
        size = 0;
        counter = -1;
    };
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Builds and returns closures that take a document and return a node.
 */
function FinderBuilder(newDocument) {
// private
    var doc = newDocument;
    
    function buildIdFinder(e) {
        if (e.id) {
            var id = e.id;
            
            return (function(targetDoc) {
                return targetDoc.getElementById(id);
            });
        }
        
        return null;
    }
    
    function buildTagNameFinder(e) {
        var elements = doc.getElementsByTagName(e.tagName);
        
        for (var i = 0, n = elements.length; i < n; ++i) {
            if (elements[i] === e) {
                // both the descendant axis and getElementsByTagName() should
                // return elements in document order; hence the following index
                // operation is possible
                return (function(targetDoc) {
                    return targetDoc.getElementsByTagName(e.tagName)[i];
                });
            }
        }
        
        return null;
    }
    
// public
    this.setDocument = function(newDocument) {
        doc = newDocument;
        return this;
    };
    
    this.build = function(e) {
        return (
            buildIdFinder(e) ||
            buildTagNameFinder(e)
        );
    };
}
///////////////////////////////////////////////////////////////////////////////

/**
 * @param newEngine  the XPath engine used to navigate this document
 */
function MirroredDocument() {
// private
    var originalDoc;
    var reflectionDoc;
    var namespaceResolver;
    var finderBuilder = new FinderBuilder();
    var pastReflections = new BoundedCache(50);

    /**
     * Appends elements represented by the given HTML to the given parent
     * element. All <script> elements are omitted.
     */
    function appendHTML(html, parentNode) {
       // var scripts = jQuery.clean([ html ], null, parentNode); // FIXME: jquery removal
    }
    
    function getHeadHtml(doc) {
        return doc.getElementsByTagName('head')[0].innerHTML;
    }
    
    function getBodyHtml(doc) {
        return doc.body.innerHTML;
    }
    
    /**
     * Copies the given HTML as the content of the current document's <head>
     * element. If the current document's head already contains identical
     * markup, copying is skipped. <script> elements are omitted.
     */
    function copyHead(headHtml, doc) {
        var head = doc.getElementsByTagName('head')[0];
        
        if (head.innerHTML == headHtml) {
            // the content is already correct
            return;
        }
        while (head.firstChild) {
            head.removeChild(head.firstChild);
        }
        
        appendHTML(headHtml, head);
    }
    
    /**
     * Copies the given HTML as the content of the current document's <body>
     * element. If the current document's body already contains identical
     * markup, copying is skipped. <script> elements are omitted.
     */
    function copyBody(bodyHtml, doc) {
        if (doc.body.innerHTML == bodyHtml) {
            return;
        }
        
        while (doc.body.firstChild) {
            doc.body.removeChild(doc.body.firstChild);
        }
        
        appendHTML(bodyHtml, doc.body);
    }
    
// public
    this.setOriginal = function(newOriginalDoc) {
        originalDoc = newOriginalDoc;
        return this;
    };
    
    this.getOriginal = function() {
        return originalDoc;
    };
    
    this.setReflection = function(newReflectionDoc) {
        reflectionDoc = newReflectionDoc;
        return this;
    }
    
    this.getReflection = function() {
        return reflectionDoc;
    };
    
    this.setNamespaceResolver = function(newNamespaceResolver) {
        namespaceResolver = newNamespaceResolver;
        return this;
    };
    
    /**
     * Makes sure the reflected document reflects the original. Returns this
     * object.
     */
    this.reflect = function() {
        if (reflectionDoc == originalDoc) {
            // the reflection and the original are one and the same
            return this;
        }
        
        var originalHtml = originalDoc.documentElement.innerHTML;
        var pastReflectionHtml = pastReflections.get(originalHtml);
        
        if (pastReflectionHtml != null &&
            pastReflectionHtml == reflectionDoc.documentElement.innerHTML) {
            // the reflection is already accurate
            return this;
        }
    
        var headHtml = getHeadHtml(originalDoc);
        var bodyHtml = getBodyHtml(originalDoc);
        
        try {
            copyHead(headHtml, reflectionDoc);
            copyBody(bodyHtml, reflectionDoc);
            
            pastReflections.put(originalHtml,
                reflectionDoc.documentElement.innerHTML);
        }
        catch (e) {
            safe_log('warn', 'Document reflection failed: ' + e.message);
        }
        
        return this;
    };
    
    /**
     * Returns the node in the reflection that corresponds to node in the
     * original document. Returns null if the reflected node can't be found.
     */
    this.getReflectedNode = function(originalNode) {
        if (reflectionDoc == originalDoc) {
            // the reflection and the original are one and the same
            return originalNode;
        }
    
        if (originalNode == originalDoc) {
            return reflectionDoc;
        }
    
        var finder = finderBuilder.setDocument(originalDoc).build(originalNode);
        
        return finder(reflectionDoc) || null;
    };
}

///////////////////////////////////////////////////////////////////////////////

function XPathOptimizationCache(newMaxSize) {
// private
    var cache = new BoundedCache(newMaxSize);

// public
    /**
     * Returns the optimized item by document markup and XPath, or null if
     * it is not found in the cache. Never calls put() on the underlying cache.
     */
    this.get = function(html, xpath) {
        var byHtml = cache.get(html);
        
        return byHtml ? byHtml[xpath] : null;
    };

    /**
     * Returns the optimization item by document markup and XPath. Returns an
     * empty map object that has been added to the cache if the item did not
     * exist previously. Never returns null.
     */
    this.getOrCreate = function(html, xpath) {
        var byHtml = cache.get(html);
        
        if (byHtml == null) {
            var result = {};
            var optimizations = {};
            
            optimizations[xpath] = result;
            cache.put(html, optimizations);
            return result;
        }
        
        var item = byHtml[xpath];
        
        if (item == null) {
            var result = {};
            
            byHtml[xpath] = result;
            return result;
        }
        
        return item;
    };
}

///////////////////////////////////////////////////////////////////////////////

function XPathOptimizer(newEngine) {
// private
    var engine = newEngine;
    var namespaceResolver;
    var mirror = new MirroredDocument(namespaceResolver);
    var finderBuilder = new FinderBuilder();
    
    // keys are full document HTML strings, and values are mappings from
    // XPath's to objects which the following fields:
    //
    //   - finder       the equivalent finder function for the XPath, for
    //                  single node selection
    //   - nodeCount    the node count for the XPath with respect to the given
    //                  document content
    //   - node         the actual, potentially invalidated, node
    //   - sourceIndex  the value of the sourceIndex attribute of the node at
    //                  time of addition to the cache; this can be used to
    //                  determine if the node has since changed positions
    //
    var knownOptimizations = new XPathOptimizationCache(100);
    
    /**
     * Returns whether this optimizer is capable of optimizing XPath's for the
     * given node.
     */
    function isOptimizable(node) {
        return (node.nodeType == 1);
    }
    
    /**
     * Returns whether the given XPath evaluates to the given node in the
     * test document.
     */
    function isXPathValid(xpath, node) {
        var contextNode = mirror.getReflection();
        return (engine.setDocument(mirror.getReflection())
            .selectSingleNode(xpath, contextNode, namespaceResolver) === node);
    }
    
// public
    this.setDocument = function(newDocument) {
        mirror.setOriginal(newDocument);
        return this;
    }

    /**
     * Sets the document object that will be used for test XPath evaluation and
     * traversal related to construction of the optimized expression. This
     * document will be modified freely by the optimize() operation.
     */
    this.setTestDocument = function(newTestDocument) {
        mirror.setReflection(newTestDocument);
        return this;
    };
    
    this.setNamespaceResolver = function(newNamespaceResolver) {
        namespaceResolver = newNamespaceResolver;
        mirror.setNamespaceResolver(newNamespaceResolver);
        return this;
    };
    
    /**
     * Returns an optimal XPath whose first result is the same as the first
     * result of the given XPath, when evaluated on the currently set document.
     * If optimization fails, returns the original XPath.
     */
    this.getOptimizedFinder = function(xpath, contextNode) {
        var originalHtml = mirror.getOriginal().documentElement.innerHTML;
        var optimization = knownOptimizations.get(originalHtml, xpath);
        
        if (optimization) {
            var finder =  optimization.finder;
            
            if (finder) {
                // the optimized finder for this document content was found in
                // the cache!
                safe_log('info', 'Found cached optimized finder for ' + xpath);
                return finder;
            }
        }
        
        mirror.reflect();
    
        if (contextNode) {
            contextNode = mirror.getReflectedNode(contextNode);
        }
        
        var firstResult = engine.setDocument(mirror.getReflection())
            .selectSingleNode(xpath, contextNode, namespaceResolver);
        
        if (! firstResult) {
            // either the element doesn't exist, or there was a failure to
            // reflect the document accurately
            return null;
        }
        
        if (isOptimizable(firstResult)) {
            var finder = finderBuilder.setDocument(mirror.getReflection())
                .build(firstResult);
            
            if (finder) {
                safe_log('info', 'Found optimized finder: ' + finder);
                
                if (! optimization) {
                    optimization = knownOptimizations
                        .getOrCreate(originalHtml, xpath);
                }
                
                optimization.finder = finder;
                
                return finder;
            }
        }
        
        return null;
    };
    
    this.countNodes = function(xpath, contextNode) {
        var originalHtml = mirror.getOriginal().documentElement.innerHTML;
        var optimization = knownOptimizations.get(originalHtml, xpath);
        
        if (optimization) {
            var nodeCount = optimization.nodeCount;
            
            if (nodeCount != null) {
                // the node count for the XPath for this document content was
                // found in the cache!
                safe_log('info', 'Found cached node count for ' + xpath);
                return nodeCount;
            }
        }
        
        mirror.reflect();
        
        if (contextNode) {
            contextNode = mirror.getReflectedNode(contextNode);
        }
        
        // count the nodes using the test document, and circumvent
        // window RPC altogether
        var nodeCount = engine.setDocument(mirror.getReflection())
            .countNodes(xpath, contextNode, namespaceResolver);
        
        if (! optimization) {
            optimization = knownOptimizations.getOrCreate(originalHtml, xpath);
        }
        
        optimization.nodeCount = nodeCount;
        
        return nodeCount;
    };
    
    this.getKnownOptimizations = function() {
        return knownOptimizations;
    };
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Implements XPathEngine.
 *
 * A non-native XPathEngine that tries to avoid inter-window RPC calls, which
 * are very expensive for IE. It does this by cloning the document from a
 * "remote" window to a "local" window, and performing operations on the local
 * clone where possible. The selectSingleNode() and countNodes() methods may
 * benefit from optimization, while selectNodes() currently will not.
 *
 * @param newFrameName       the name of the DOM window frame whose document
 *                           to use exclusively for XPath optimization
 * @param newDelegateEngine  the underlying engine delegate used to evaluate
 *                           XPath's. Defaults to a JavascriptXPathEngine
 *                           instance.
 */
function MultiWindowRPCOptimizingEngine(newFrameName, newDelegateEngine) {
// private
    var NO_RESULT = '__NO_NODE_RESULT';
    
    var frameName = newFrameName;
    var engine = newDelegateEngine || new JavascriptXPathEngine();
    var optimizer = new XPathOptimizer(engine);

    function createTestDocument() {
        if (! window.frames[frameName]) {
            var iframe = document.createElement('iframe');
            
            iframe.id = frameName;
            iframe.name = frameName;
            iframe.width = 0;
            iframe.height = 0;
            
            document.body.appendChild(iframe);
        }
    }
    
    function isMultiWindowMode() {
        return (typeof(runOptions) != 'undefined' &&
            runOptions &&
            runOptions.isMultiWindowMode());
    };
    
    /**
     * Returns whether a node is detached from any live documents. Detached
     * nodes should be considered invalidated and evicted from any caches.
     */
    function isDetached(node) {
        while (node = node.parentNode) {
            if (node.nodeType == 11) {
                // it's a document fragment; we're detached (IE)
                return true;
            }
            else if (node.nodeType == 9) {
                // it's a normal document; we're attached
                return false;
            }
        }
        
        // we didn't find a document; we're detached (most other browsers)
        return true;
    }
    
// public
    // Override
    this.isAvailable = function() {
        // though currently it only makes sense to use this engine for IE, we
        // do not impose that restriction here.
        return engine.isAvailable();
    };
    
    // Override
    this.setDocument = function(newDocument) {
        this.doc = newDocument;
        engine.setDocument(newDocument);
        optimizer.setDocument(newDocument);
        return this;
    };

    /**
     * No optimization performed for multi-node selections. This is because the
     * optimizer only works for single node results.
     */
    // Override
    this.selectNodes = function(xpath, contextNode, namespaceResolver) {
        return engine.selectNodes(xpath, contextNode, namespaceResolver);
    };
    
    // Override
    this.selectSingleNode = function(xpath, contextNode, namespaceResolver) {
        var html = this.doc.documentElement.innerHTML;
        var knownOptimizations = optimizer.getKnownOptimizations();
        var optimization = knownOptimizations.get(html, xpath);
        
        if (optimization) {
            var node = optimization.node;
            var sourceIndex = optimization.sourceIndex;
            
            if (node == NO_RESULT) {
                return null;
            }
            
            // node is still valid? (test ok even if sourceIndex is null)
            if (! isDetached(node) && node.sourceIndex == sourceIndex) {
                safe_log('info', 'Found cached node for ' + xpath);
                return node;
            }
        }
        
        var node;
        var finder = optimizer.setNamespaceResolver(namespaceResolver)
            .setTestDocument(this.getTestDocument())
            .getOptimizedFinder(xpath, contextNode);
        
        if (finder) {
            node = finder(this.doc);
        }
        else {
            node = engine.selectSingleNode(xpath, contextNode,
                namespaceResolver);
        }
        
        if (! optimization) {
            optimization = knownOptimizations.getOrCreate(html, xpath);
        }
        
        if (node) {
            optimization.node = node;
            optimization.sourceIndex = node.sourceIndex;
        }
        else {
            optimization.node = NO_RESULT;
        }
        
        return node;
    };
    
    // Override
    this.countNodes = function(xpath, contextNode, namespaceResolver) {
        return optimizer.setNamespaceResolver(namespaceResolver)
            .setTestDocument(this.getTestDocument())
            .countNodes(xpath, contextNode);
    };
    
    // Override
    this.setIgnoreAttributesWithoutValue = function(ignore) {
        engine.setIgnoreAttributesWithoutValue(ignore);
        return this;
    };
    
    /**
     * Returns the "local" document as a frame in the Selenium runner document.
     */
    this.getTestDocument = function() {
        // made this a public method, because apparently private methods can't
        // access "this" of the instance.
        return (isMultiWindowMode()
            ? window.frames[frameName].document
            : this.doc);
    };
    
// initialization

    // creating the frame and the document it contains is not a synchronous
    // operation (at least not for IE), so we should create it eagerly
    if (isMultiWindowMode()) {
        createTestDocument();
    }
}

MultiWindowRPCOptimizingEngine.prototype = new XPathEngine();

/**
 * An object responsible for handling XPath logic. New XPath engines can be
 * registered to this evaluator on the fly.
 *
 * @param newDefaultEngineName  the name of the default XPath engine. Must be
 *                              a non-native engine that is always available.
 *                              Defaults to 'ajaxslt'.
 */
function XPathEvaluator(newDefaultEngineName) {
// private
    var nativeEngine = new NativeEngine();
    var defaultEngineName = newDefaultEngineName || 'ajaxslt';
    var engines = {
        'ajaxslt'               : new AjaxsltEngine(),
        'javascript-xpath'      : new JavascriptXPathEngine(),
        'rpc-optimizing-ajaxslt': new MultiWindowRPCOptimizingEngine('test-doc-frame', new AjaxsltEngine()),
        'rpc-optimizing-jsxpath': new MultiWindowRPCOptimizingEngine('test-doc-frame', new JavascriptXPathEngine()),
        'native'                : nativeEngine
    };
    
    var currentEngineName = defaultEngineName;
    var allowNativeXPath = true;
    var ignoreAttributesWithoutValue = true;
    
    function preprocess(xpath) {
        // Trim any trailing "/": not valid xpath, and remains from attribute
        // locator.
        if (xpath.charAt(xpath.length - 1) == '/') {
            xpath = xpath.slice(0, -1);
        }
        // HUGE hack - remove namespace from xpath for IE
        if (browserVersion && browserVersion.isIE) {
            xpath = xpath.replace(/x:/g, '')
        }
        
        return xpath;
    }
    
    /** 
     * Returns the most sensible engine given the settings and the document
     * object.
     */
    function getEngineFor(inDocument) {
        if (allowNativeXPath &&
            nativeEngine.setDocument(inDocument).isAvailable()) {
            return nativeEngine;
        }
        
        var currentEngine = engines[currentEngineName];
        
        if (currentEngine &&
            currentEngine.setDocument(inDocument).isAvailable()) {
            return currentEngine;
        }
        
        return engines[defaultEngineName].setDocument(inDocument);
    }
    
    /**
     * Dispatches an XPath evaluation method on the relevant engine for the
     * given document, and returns the result
     */
    function dispatch(methodName, inDocument, xpath, contextNode, namespaceResolver) {
        xpath = preprocess(xpath);
    
        if (! contextNode) {
            contextNode = inDocument;
        }
        
        var result = getEngineFor(inDocument)
            .setIgnoreAttributesWithoutValue(ignoreAttributesWithoutValue)
            [methodName](xpath, contextNode, namespaceResolver);
            
        return result;
    }
    
// public
    /**
     * Registers a new engine by name, and returns whether the registration was
     * successful. Each registered engine must be an instance of XPathEngine.
     * The engines registered by default - "ajaxslt", "javascript-xpath",
     * "native", and "default" - can't be overwritten.
     */
    this.registerEngine = function(name, engine) {
        // can't overwrite one of these
        if (name == 'ajaxslt' ||
            name == 'javascript-xpath' ||
            name == 'native' ||
            name == 'default') {
            return false;
        }
        
        if (! (engine instanceof XPathEngine)) {
            return false;
        }
        
        engines[name] = engine;
        return true;
    };
    
    this.getRegisteredEngine = function(name) {
        return engines[name];
    };
    
    this.setCurrentEngine = function(name) {
        if (name == 'default') {
            currentEngineName = defaultEngineName;
        }
        else if (! engines[name]) {
            return;
        }
        else {
            currentEngineName = name;
        }
    };
    
    this.getCurrentEngine = function() {
        return currentEngineName || defaultEngineName;
    };
    
    this.setAllowNativeXPath = function(allow) {
        allowNativeXPath = allow;
    };
    
    this.isAllowNativeXPath = function() {
        return allowNativeXPath;
    };
    
    this.setIgnoreAttributesWithoutValue = function(ignore) {
        ignoreAttributesWithoutValue = ignore;
    };
    
    this.isIgnoreAttributesWithoutValue = function() {
        return ignoreAttributesWithoutValue;
    };
    
    this.selectNodes = function(inDocument, xpath, contextNode, namespaceResolver) {
        return dispatch('selectNodes', inDocument, xpath, contextNode,
            namespaceResolver);
    };
    
    this.selectSingleNode = function(inDocument, xpath, contextNode, namespaceResolver) {
        return dispatch('selectSingleNode', inDocument, xpath, contextNode,
            namespaceResolver);
    };
    
    this.countNodes = function(inDocument, xpath, contextNode, namespaceResolver) {
        return dispatch('countNodes', inDocument, xpath, contextNode,
            namespaceResolver);
    };
    
// initialization
    this.init();
};

/**
 * Gives the user an overridable hook for registering new XPath engines, for
 * example from user extensions.
 */
XPathEvaluator.prototype.init = function() {};

/**
 * Evaluates an xpath on a document, and returns a list containing nodes in the
 * resulting nodeset. The browserbot xpath methods are now backed by this
 * function. A context node may optionally be provided, and the xpath will be
 * evaluated from that context.
 *
 * @param xpath       the xpath to evaluate
 * @param inDocument  the document in which to evaluate the xpath.
 * @param opts        (optional) An object containing various flags that can
 *                    modify how the xpath is evaluated. Here's a listing of
 *                    the meaningful keys:
 *
 *                     contextNode: 
 *                       the context node from which to evaluate the xpath. If
 *                       unspecified, the context will be the root document
 *                       element.
 *
 *                     namespaceResolver:
 *                       the namespace resolver function. Defaults to null.
 *
 *                     xpathLibrary:
 *                       the javascript library to use for XPath. "ajaxslt" is
 *                       the default. "javascript-xpath" is newer and faster,
 *                       but needs more testing.
 *
 *                     allowNativeXpath:
 *                       whether to allow native evaluate(). Defaults to true.
 *
 *                     ignoreAttributesWithoutValue:
 *                       whether it's ok to ignore attributes without value
 *                       when evaluating the xpath. This can greatly improve
 *                       performance in IE; however, if your xpaths depend on
 *                       such attributes, you can't ignore them! Defaults to
 *                       true.
 *
 *                     returnOnFirstMatch:
 *                       whether to optimize the XPath evaluation to only
 *                       return the first match. The match, if any, will still
 *                       be returned in a list. Defaults to false.
 */
function eval_xpath(xpath, inDocument, opts)
{
    if (! opts) {
        var opts = {};
    }
    
    var contextNode = opts.contextNode
        ? opts.contextNode : inDocument;
    var namespaceResolver = opts.namespaceResolver
        ? opts.namespaceResolver : null;
    var xpathLibrary = opts.xpathLibrary
        ? opts.xpathLibrary : null;
    var allowNativeXpath = (opts.allowNativeXpath != undefined)
        ? opts.allowNativeXpath : true;
    var ignoreAttributesWithoutValue = (opts.ignoreAttributesWithoutValue != undefined)
        ? opts.ignoreAttributesWithoutValue : true;
    var returnOnFirstMatch = (opts.returnOnFirstMatch != undefined)
        ? opts.returnOnFirstMatch : false;

    if (! eval_xpath.xpathEvaluator) {
        eval_xpath.xpathEvaluator = new XPathEvaluator();
    }
    
    var xpathEvaluator = eval_xpath.xpathEvaluator;
    
    xpathEvaluator.setCurrentEngine(xpathLibrary);
    xpathEvaluator.setAllowNativeXPath(allowNativeXpath);
    xpathEvaluator.setIgnoreAttributesWithoutValue(ignoreAttributesWithoutValue);
    
    if (returnOnFirstMatch) {
        var singleNode = xpathEvaluator.selectSingleNode(inDocument, xpath,
            contextNode, namespaceResolver);
        
        var results = (singleNode ? [ singleNode ] : []);
    }
    else {
        var results = xpathEvaluator.selectNodes(inDocument, xpath, contextNode,
            namespaceResolver);
    }
    
    return results;
}

/**
 * Returns the full resultset of a CSS selector evaluation.
 */
function eval_css(locator, inDocument) {
    var results = [];
    try {
      window.Sizzle(locator, inDocument, results);
    } catch (ignored) {
      // Presumably poor formatting
    }
    return results;
}

/**
 * This function duplicates part of BrowserBot.findElement() to open up locator
 * evaluation on arbitrary documents. It returns a plain old array of located
 * elements found by using a Selenium locator.
 * 
 * Multiple results may be generated for xpath and CSS locators. Even though a
 * list could potentially be generated for other locator types, such as link,
 * we don't try for them, because they aren't very expressive location
 * strategies; if you want a list, use xpath or CSS. Furthermore, strategies
 * for these locators have been optimized to only return the first result. For
 * these types of locators, performance is more important than ideal behavior.
 * 
 * @param locator          a locator string
 * @param inDocument       the document in which to apply the locator
 * @param opt_contextNode  the context within which to evaluate the locator
 *
 * @return  a list of result elements
 */
function eval_locator(locator, inDocument, opt_contextNode)
{
    locator = parse_locator(locator);
    
    var pageBot;
    if (typeof(selenium) != 'undefined' && selenium != undefined) {
        if (typeof(editor) == 'undefined' || editor.state == 'playing') {
            safe_log('info', 'Trying [' + locator.type + ']: '
                + locator.string);
        }
        pageBot = selenium.browserbot;
    }
    else {
        if (!UI_GLOBAL.mozillaBrowserBot) {
            // create a browser bot to evaluate the locator. Hand it the IDE
            // window as a dummy window, and cache it for future use.
            UI_GLOBAL.mozillaBrowserBot = new MozillaBrowserBot(window)
        }
        pageBot = UI_GLOBAL.mozillaBrowserBot;
    }
    
    var results = [];
    
    if (locator.type == 'xpath' || (locator.string.charAt(0) == '/' &&
        locator.type == 'implicit')) {
        results = eval_xpath(locator.string, inDocument,
            { contextNode: opt_contextNode });
    }
    else if (locator.type == 'css') {
        results = eval_css(locator.string, inDocument);
    }
    else {
        var element = pageBot
            .findElementBy(locator.type, locator.string, inDocument);
        if (element != null) {
            results.push(element);
        }
    }

    return results;
}

//******************************************************************************
// UI-Element

/**
 * Escapes the special regular expression characters in a string intended to be
 * used as a regular expression.
 *
 * Based on: http://simonwillison.net/2006/Jan/20/escape/
 */
RegExp.escape = (function() {
    var specials = [
        '/', '.', '*', '+', '?', '|', '^', '$',
        '(', ')', '[', ']', '{', '}', '\\'
    ];
    
    var sRE = new RegExp(
        '(\\' + specials.join('|\\') + ')', 'g'
    );
  
    return function(text) {
        return text.replace(sRE, '\\$1');
    }
})();

/**
 * Returns true if two arrays are identical, and false otherwise.
 *
 * @param a1  the first array, may only contain simple values (strings or
 *            numbers)
 * @param a2  the second array, same restricts on data as for a1
 * @return    true if the arrays are equivalent, false otherwise.
 */
function are_equal(a1, a2)
{
    if (typeof(a1) != typeof(a2))
        return false;
    
    switch(typeof(a1)) {
        case 'object':
            // arrays
            if (a1.length) {
                if (a1.length != a2.length)
                    return false;
                for (var i = 0; i < a1.length; ++i) {
                    if (!are_equal(a1[i], a2[i]))
                        return false
                }
            }
            // associative arrays
            else {
                var keys = {};
                for (var key in a1) {
                    keys[key] = true;
                }
                for (var key in a2) {
                    keys[key] = true;
                }
                for (var key in keys) {
                    if (!are_equal(a1[key], a2[key]))
                        return false;
                }
            }
            return true;
            
        default:
            return a1 == a2;
    }
}
/**
 * Create a clone of an object and return it. This is a deep copy of everything
 * but functions, whose references are copied. You shouldn't expect a deep copy
 * of functions anyway.
 *
 * @param orig  the original object to copy
 * @return      a deep copy of the original object. Any functions attached,
 *              however, will have their references copied only.
 */
function clone(orig) {
    var copy;
    switch(typeof(orig)) {
        case 'object':
            copy = (orig.length) ? [] : {};
            for (var attr in orig) {
                copy[attr] = clone(orig[attr]);
            }
            break;
        default:
            copy = orig;
            break;
    }
    return copy;
}

/**
 * Emulates php's print_r() functionality. Returns a nicely formatted string
 * representation of an object. Very useful for debugging.
 *
 * @param object    the object to dump
 * @param maxDepth  the maximum depth to recurse into the object. Ellipses will
 *                  be shown for objects whose depth exceeds the maximum.
 * @param indent    the string to use for indenting progressively deeper levels
 *                  of the dump.
 * @return          a string representing a dump of the object
 */
function print_r(object, maxDepth, indent)
{
    var parentIndent, attr, str = "";
    if (arguments.length == 1) {
        var maxDepth = Number.MAX_VALUE;
    } else {
        maxDepth--;
    }
    if (arguments.length < 3) {
        parentIndent = ''
        var indent = '    ';
    } else {
        parentIndent = indent;
        indent += '    ';
    }

    switch(typeof(object)) {
    case 'object':
        if (object.length != undefined) {
            if (object.length == 0) {
                str += "Array ()\r\n";
            }
            else {
                str += "Array (\r\n";
                for (var i = 0; i < object.length; ++i) {
                    str += indent + '[' + i + '] => ';
                    if (maxDepth == 0)
                        str += "...\r\n";
                    else
                        str += print_r(object[i], maxDepth, indent);
                }
                str += parentIndent + ")\r\n";
            }
        }
        else {
            str += "Object (\r\n";
            for (attr in object) {
                str += indent + "[" + attr + "] => ";
                if (maxDepth == 0)
                    str += "...\r\n";
                else
                    str += print_r(object[attr], maxDepth, indent);
            }
            str += parentIndent + ")\r\n";
        }
        break;
    case 'boolean':
        str += (object ? 'true' : 'false') + "\r\n";
        break;
    case 'function':
        str += "Function\r\n";
        break;
    default:
        str += object + "\r\n";
        break;

    }
    return str;
}

/**
 * Return an array containing all properties of an object. Perl-style.
 *
 * @param object  the object whose keys to return
 * @return        array of object keys, as strings
 */
function keys(object)
{
    var keys = [];
    for (var k in object) {
        keys.push(k);
    }
    return keys;
}

/**
 * Emulates python's range() built-in. Returns an array of integers, counting
 * up (or down) from start to end. Note that the range returned is up to, but
 * NOT INCLUDING, end.
 *.
 * @param start  integer from which to start counting. If the end parameter is
 *               not provided, this value is considered the end and start will
 *               be zero.
 * @param end    integer to which to count. If omitted, the function will count
 *               up from zero to the value of the start parameter. Note that
 *               the array returned will count up to but will not include this
 *               value.
 * @return       an array of consecutive integers. 
 */
function range(start, end)
{
    if (arguments.length == 1) {
        var end = start;
        start = 0;
    }
    
    var r = [];
    if (start < end) {
        while (start != end)
            r.push(start++);
    }
    else {
        while (start != end)
            r.push(start--);
    }
    return r;
}

/**
 * Parses a python-style keyword arguments string and returns the pairs in a
 * new object.
 *
 * @param  kwargs  a string representing a set of keyword arguments. It should
 *                 look like <tt>keyword1=value1, keyword2=value2, ...</tt>
 * @return         an object mapping strings to strings
 */
function parse_kwargs(kwargs)
{
    var args = new Object();
    var pairs = kwargs.split(/,/);
    for (var i = 0; i < pairs.length;) {
        if (i > 0 && pairs[i].indexOf('=') == -1) {
            // the value string contained a comma. Glue the parts back together.
            pairs[i-1] += ',' + pairs.splice(i, 1)[0];
        }
        else {
            ++i;
        }
    }
    for (var i = 0; i < pairs.length; ++i) {
        var splits = pairs[i].split(/=/);
        if (splits.length == 1) {
            continue;
        }
        var key = splits.shift();
        var value = splits.join('=');
        args[key.trim()] = value.trim();
    }
    return args;
}

/**
 * Creates a python-style keyword arguments string from an object.
 *
 * @param args        an associative array mapping strings to strings
 * @param sortedKeys  (optional) a list of keys of the args parameter that
 *                    specifies the order in which the arguments will appear in
 *                    the returned kwargs string
 *
 * @return            a kwarg string representation of args
 */
function to_kwargs(args, sortedKeys)
{
    var s = '';
    if (!sortedKeys) {
        var sortedKeys = keys(args).sort();
    }
    for (var i = 0; i < sortedKeys.length; ++i) {
        var k = sortedKeys[i];
        if (args[k] != undefined) {
            if (s) {
                s += ', ';
            }
            s += k + '=' + args[k];
        }
    }
    return s;
}

/**
 * Returns true if a node is an ancestor node of a target node, and false
 * otherwise.
 *
 * @param node    the node being compared to the target node
 * @param target  the target node
 * @return        true if node is an ancestor node of target, false otherwise.
 */
function is_ancestor(node, target)
{
    while (target.parentNode) {
        target = target.parentNode;
        if (node == target)
            return true;
    }
    return false;
}

//******************************************************************************
// parseUri 1.2.1
// MIT License

/*
Copyright (c) 2007 Steven Levithan <stevenlevithan.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
*/

function parseUri (str) {
    var o   = parseUri.options,
        m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i   = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
};

parseUri.options = {
    strictMode: false,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};


/**
 * Construct the UI map object, and return it. Once the object is instantiated,
 * it binds to a global variable and will not leave scope.
 *
 * @return  new UIMap object
 */
function UIMap()
{
    // the singleton pattern, split into two parts so that "new" can still
    // be used, in addition to "getInstance()"
    UIMap.self = this;
    
    // need to attach variables directly to the Editor object in order for them
    // to be in scope for Editor methods
    if (is_IDE()) {
        Editor.uiMap = this;
        Editor.UI_PREFIX = UI_GLOBAL.UI_PREFIX;
    }
    
    this.pagesets = new Object();
    
    
    
    /**
     * pageset[pagesetName]
     *   regexp
     *   elements[elementName]
     *     UIElement
     */
    this.addPageset = function(pagesetShorthand)
    {
        try {
            var pageset = new Pageset(pagesetShorthand);
        }
        catch (e) {
            safe_alert("Could not create pageset from shorthand:\n"
                + print_r(pagesetShorthand) + "\n" + e.message);
            return false;
        }
        
        if (this.pagesets[pageset.name]) {
            safe_alert('Could not add pageset "' + pageset.name
                + '": a pageset with that name already exists!');
            return false;
        }
        
        this.pagesets[pageset.name] = pageset;
        return true;
    };
    
    
    
    /**
     * @param pagesetName
     * @param uiElementShorthand  a representation of a UIElement object in
     *                            shorthand JSON.
     */
    this.addElement = function(pagesetName, uiElementShorthand)
    {
        try {
            var uiElement = new UIElement(uiElementShorthand);
        }
        catch (e) {
            safe_alert("Could not create UI element from shorthand:\n"
                + print_r(uiElementShorthand) + "\n" + e.message);
            return false;
        }
        
        // run the element's unit tests only for the IDE, and only when the
        // IDE is starting. Make a rough guess as to the latter condition.
        if (is_IDE() && !editor.selDebugger && !uiElement.test()) {
            safe_alert('Could not add UI element "' + uiElement.name
                + '": failed testcases!');
            return false;
        }
        
        try {
            this.pagesets[pagesetName].uiElements[uiElement.name] = uiElement;
        }
        catch (e) {
            safe_alert("Could not add UI element '" + uiElement.name
                + "' to pageset '" + pagesetName + "':\n" + e.message);
            return false;
        }
        
        return true;
    };
    
    
    
    /**
     * Returns the pageset for a given UI specifier string.
     *
     * @param uiSpecifierString
     * @return  a pageset object
     */
    this.getPageset = function(uiSpecifierString)
    {
        try {
            var uiSpecifier = new UISpecifier(uiSpecifierString);
            return this.pagesets[uiSpecifier.pagesetName];
        }
        catch (e) {
            return null;
        }
    }
    
    
    
    /**
     * Returns the UIElement that a UISpecifierString or pageset and element
     * pair refer to.
     *
     * @param pagesetNameOrUISpecifierString
     * @return  a UIElement, or null if none is found associated with
     *          uiSpecifierString
     */
    this.getUIElement = function(pagesetNameOrUISpecifierString, uiElementName)
    {
        var pagesetName = pagesetNameOrUISpecifierString;
        if (arguments.length == 1) {
            var uiSpecifierString = pagesetNameOrUISpecifierString;
            try {
                var uiSpecifier = new UISpecifier(uiSpecifierString);
                pagesetName = uiSpecifier.pagesetName;
                var uiElementName = uiSpecifier.elementName;
            }
            catch (e) {
                return null;
            }
        }
        try {
            return this.pagesets[pagesetName].uiElements[uiElementName];
        }
        catch (e) {
            return null;
        }
    };
    
    
    
    /**
     * Returns a list of pagesets that "contains" the provided page,
     * represented as a document object. Containership is defined by the
     * Pageset object's contain() method.
     *
     * @param inDocument  the page to get pagesets for
     * @return            a list of pagesets
     */
    this.getPagesetsForPage = function(inDocument)
    {
        var pagesets = [];
        for (var pagesetName in this.pagesets) {
            var pageset = this.pagesets[pagesetName];
            if (pageset.contains(inDocument)) {
                pagesets.push(pageset);
            }
        }
        return pagesets;
    };
    
    
    
    /**
     * Returns a list of all pagesets.
     *
     * @return  a list of pagesets
     */
    this.getPagesets = function()
    {
        var pagesets = [];
        for (var pagesetName in this.pagesets) {
            pagesets.push(this.pagesets[pagesetName]);
        }
        return pagesets;
    };
    
    
    
    /**
     * Returns a list of elements on a page that a given UI specifier string,
     * maps to. If no elements are mapped to, returns an empty list..
     *
     * @param   uiSpecifierString  a String that specifies a UI element with
     *                             attendant argument values
     * @param   inDocument         the document object the specified UI element
     *                             appears in
     * @return                     a potentially-empty list of elements
     *                             specified by uiSpecifierString
     */
    this.getPageElements = function(uiSpecifierString, inDocument)
    {
        var locator = this.getLocator(uiSpecifierString);
        var results = locator ? eval_locator(locator, inDocument) : [];
        return results;
    };
    
    
    
    /**
     * Returns the locator string that a given UI specifier string maps to, or
     * null if it cannot be mapped.
     *
     * @param uiSpecifierString
     */
    this.getLocator = function(uiSpecifierString)
    {
        try {
            var uiSpecifier = new UISpecifier(uiSpecifierString);
        }
        catch (e) {
            safe_alert('Could not create UISpecifier for string "'
                + uiSpecifierString + '": ' + e.message);
            return null;
        }
        
        var uiElement = this.getUIElement(uiSpecifier.pagesetName,
            uiSpecifier.elementName);
        try {
            return uiElement.getLocator(uiSpecifier.args);
        }
        catch (e) {
            return null;
        }
    }
    
    
    
    /**
     * Finds and returns a UI specifier string given an element and the page
     * that it appears on.
     *
     * @param pageElement  the document element to map to a UI specifier
     * @param inDocument   the document the element appears in
     * @return             a UI specifier string, or false if one cannot be
     *                     constructed
     */
    this.getUISpecifierString = function(pageElement, inDocument)
    {
        var is_fuzzy_match =
            BrowserBot.prototype.locateElementByUIElement.is_fuzzy_match;
        var pagesets = this.getPagesetsForPage(inDocument);
        
        for (var i = 0; i < pagesets.length; ++i) {
            var pageset = pagesets[i];
            var uiElements = pageset.getUIElements();
            
            for (var j = 0; j < uiElements.length; ++j) {
                var uiElement = uiElements[j];
                
                // first test against the generic locator, if there is one.
                // This should net some performance benefit when recording on
                // more complicated pages.
                if (uiElement.getGenericLocator) {
                    var passedTest = false;
                    var results =
                        eval_locator(uiElement.getGenericLocator(), inDocument);
                    for (var i = 0; i < results.length; ++i) {
                        if (results[i] == pageElement) {
                            passedTest = true;
                            break;
                        }
                    }
                    if (!passedTest) {
                        continue;
                    }
                }
                
                var defaultLocators;
                if (uiElement.isDefaultLocatorConstructionDeferred) {
                    defaultLocators = uiElement.getDefaultLocators(inDocument);
                }
                else {
                    defaultLocators = uiElement.defaultLocators;
                }
                
                //safe_alert(print_r(uiElement.defaultLocators));
                for (var locator in defaultLocators) {
                    var locatedElements = eval_locator(locator, inDocument);
                    if (locatedElements.length) {
                        var locatedElement = locatedElements[0];
                    }
                    else {
                        continue;
                    }
                    
                    // use a heuristic to determine whether the element
                    // specified is the "same" as the element we're matching
                    if (is_fuzzy_match) {
                        if (is_fuzzy_match(locatedElement, pageElement)) {
                            return UI_GLOBAL.UI_PREFIX + '=' +
                                new UISpecifier(pageset.name, uiElement.name,
                                    defaultLocators[locator]);
                        }
                    }
                    else {
                        if (locatedElement == pageElement) {
                            return UI_GLOBAL.UI_PREFIX + '=' +
                                new UISpecifier(pageset.name, uiElement.name,
                                    defaultLocators[locator]);
                        }
                    }
                    
                    // ok, matching the element failed. See if an offset
                    // locator can complete the match.
                    if (uiElement.getOffsetLocator) {
                        for (var k = 0; k < locatedElements.length; ++k) {
                            var offsetLocator = uiElement
                                .getOffsetLocator(locatedElements[k], pageElement);
                            if (offsetLocator) {
                                return UI_GLOBAL.UI_PREFIX + '=' +
                                    new UISpecifier(pageset.name,
                                        uiElement.name,
                                        defaultLocators[locator])
                                    + '->' + offsetLocator;
                            }
                        }
                    }
                }
            }
        }
        return false;
    };
    
    
    
    /**
     * Returns a sorted list of UI specifier string stubs representing possible
     * UI elements for all pagesets, paired the their descriptions. Stubs
     * contain all required arguments, but leave argument values blank.
     *
     * @return  a list of UI specifier string stubs
     */
    this.getUISpecifierStringStubs = function() {
        var stubs = [];
        var pagesets = this.getPagesets();
        for (var i = 0; i < pagesets.length; ++i) {
            stubs = stubs.concat(pagesets[i].getUISpecifierStringStubs());
        }
        stubs.sort(function(a, b) {
            if (a[0] < b[0]) {
                return -1;
            }
            return a[0] == b[0] ? 0 : 1;
        });
        return stubs;
    }
}

UIMap.getInstance = function() {
    return (UIMap.self == null) ? new UIMap() : UIMap.self;
}

/*! Sizzle v2.2.1-pre | (c) jQuery Foundation, Inc. | jquery.org/license */
!function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ga(),z=ga(),A=ga(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+M+"))|)"+L+"*\\]",O=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+N+")*)|.*)\\)|)",P=new RegExp(L+"+","g"),Q=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),R=new RegExp("^"+L+"*,"+L+"*"),S=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),T=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),U=new RegExp(O),V=new RegExp("^"+M+"$"),W={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M+"|[*])"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},X=/^(?:input|select|textarea|button)$/i,Y=/^h\d$/i,Z=/^[^{]+\{\s*\[native \w/,$=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,_=/[+~]/,aa=/'|\\/g,ba=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),ca=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},da=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(ea){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fa(a,b,d,e){var f,h,j,k,l,o,r,s=b&&b.ownerDocument,w=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==w&&9!==w&&11!==w)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==w&&(l=$.exec(a)))if(f=l[1]){if(9===w){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(s&&(j=s.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(l[2])return H.apply(d,b.getElementsByTagName(a)),d;if((f=l[3])&&c.getElementsByClassName&&b.getElementsByClassName)return H.apply(d,b.getElementsByClassName(f)),d}if(!(!c.qsa||A[a+" "]||q&&q.test(a))){if(1!==w)s=b,r=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(aa,"\\$&"):b.setAttribute("id",k=u),o=g(a),h=o.length;while(h--)o[h]="[id='"+k+"'] "+qa(o[h]);r=o.join(","),s=_.test(a)&&oa(b.parentNode)||b}if(r)try{return H.apply(d,s.querySelectorAll(r)),d}catch(x){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(Q,"$1"),b,d,e)}function ga(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ha(a){return a[u]=!0,a}function ia(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ja(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function ka(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function la(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function na(a){return ha(function(b){return b=+b,ha(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function oa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=fa.support={},f=fa.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fa.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),n.documentMode&&(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ia(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ia(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Z.test(n.getElementsByClassName),c.getById=ia(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return"undefined"!=typeof b.getElementsByClassName&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=Z.test(n.querySelectorAll))&&(ia(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ia(function(a){var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Z.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ia(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",O)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Z.test(o.compareDocumentPosition),t=b||Z.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return ka(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?ka(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},fa.matches=function(a,b){return fa(a,null,null,b)},fa.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(T,"='$1']"),!(!c.matchesSelector||!p||A[b+" "]||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fa(b,n,null,[a]).length>0},fa.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fa.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fa.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fa.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fa.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fa.selectors={cacheLength:50,createPseudo:ha,match:W,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ba,ca),a[3]=(a[3]||a[4]||a[5]||"").replace(ba,ca),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fa.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fa.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return W.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&U.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ba,ca).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fa.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(P," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fa.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ha(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ha(function(a){var b=[],c=[],d=h(a.replace(Q,"$1"));return d[u]?ha(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ha(function(a){return function(b){return fa(a,b).length>0}}),contains:ha(function(a){return a=a.replace(ba,ca),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ha(function(a){return V.test(a||"")||fa.error("unsupported lang: "+a),a=a.replace(ba,ca).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Y.test(a.nodeName)},input:function(a){return X.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:na(function(){return[0]}),last:na(function(a,b){return[b-1]}),eq:na(function(a,b,c){return[0>c?c+b:c]}),even:na(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:na(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:na(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:na(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=la(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=ma(b);function pa(){}pa.prototype=d.filters=d.pseudos,d.setFilters=new pa,g=fa.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=R.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=S.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(Q," ")}),h=h.slice(c.length));for(g in d.filter)!(e=W[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fa.error(a):z(a,i).slice(0)};function qa(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function ra(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(j=b[u]||(b[u]={}),i=j[b.uniqueID]||(j[b.uniqueID]={}),(h=i[d])&&h[0]===w&&h[1]===f)return k[2]=h[2];if(i[d]=k,k[2]=a(b,c,g))return!0}}}function sa(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ta(a,b,c){for(var d=0,e=b.length;e>d;d++)fa(a,b[d],c);return c}function ua(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function va(a,b,c,d,e,f){return d&&!d[u]&&(d=va(d)),e&&!e[u]&&(e=va(e,f)),ha(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ta(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ua(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ua(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ua(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function wa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ra(function(a){return a===b},h,!0),l=ra(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[ra(sa(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return va(i>1&&sa(m),i>1&&qa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(Q,"$1"),c,e>i&&wa(a.slice(i,e)),f>e&&wa(a=a.slice(e)),f>e&&qa(a))}m.push(c)}return sa(m)}function xa(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=F.call(i));u=ua(u)}H.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&fa.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ha(f):f}h=fa.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xa(e,d)),f.selector=a}return f},i=fa.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ba,ca),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=W.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ba,ca),_.test(j[0].type)&&oa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qa(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||_.test(a)&&oa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ia(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ia(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ja("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ia(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ja("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ia(function(a){return null==a.getAttribute("disabled")})||ja(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),"function"==typeof define&&define.amd?define(function(){return fa}):"undefined"!=typeof module&&module.exports?module.exports=fa:a.Sizzle=fa}(window);
