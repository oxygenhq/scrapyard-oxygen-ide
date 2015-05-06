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
};

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
};

/**
 * Convert all newlines to \n
 */
function normalizeNewlines(text)
{
    return text.replace(/\r\n|\r/g, "\n");
};

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
};

function createEventObject(element, controlKeyDown, altKeyDown, shiftKeyDown, metaKeyDown) {
     var evt = element.ownerDocument.createEventObject();
     evt.shiftKey = shiftKeyDown;
     evt.metaKey = metaKeyDown;
     evt.altKey = altKeyDown;
     evt.ctrlKey = controlKeyDown;
     return evt;
};

function removeLoadListener(element, command) {
    LOG.debug('Removing loadListenter for ' + element + ', ' + command);
    if (window.removeEventListener)
        element.removeEventListener("load", command, true);
    else if (window.detachEvent)
        element.detachEvent("onload", command);
};

function addLoadListener(element, command) {
    LOG.debug('Adding loadListenter for ' + element + ', ' + command);
    var augmentedCommand = function() {
        command.call(this, element);
    }
    if (window.addEventListener && !browserVersion.isOpera)
        element.addEventListener("load", augmentedCommand, true);
    else if (window.attachEvent)
        element.attachEvent("onload", augmentedCommand);
};

function getTagName(element) {
    var tagName;
    if (element && element.tagName && element.tagName.toLowerCase) {
        tagName = element.tagName.toLowerCase();
    }
    return tagName;
};

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
};

function extractExceptionMessage(ex) {
    if (ex == null) return "null exception";
    if (ex.message != null) return ex.message;
    if (ex.toString && ex.toString() != null) return ex.toString();
};


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
};

// for use from vs.2003 debugger
function o2s(obj) {
    var s = "";
    for (key in obj) {
        var line = key + "->" + obj[key];
        line.replace("\n", " ");
        s += line + "\n";
    }
    return s;
};

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
};

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

///////////////////////////////////////////////////////////////////////////////

function WickedGoodXPathEngine() {
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

WickedGoodXPathEngine.prototype = new XPathEngine();

///////////////////////////////////////////////////////////////////////////////
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
    var defaultEngineName = newDefaultEngineName || 'wgxpath';
    var engines = {
        'wgxpath'      : new WickedGoodXPathEngine(),
        'native'       : nativeEngine
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
        if (name == 'wgxpath' || name == 'default') {
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