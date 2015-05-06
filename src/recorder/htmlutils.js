/*
 * Copyright 2011 Software Freedom Conservancy
 *  Licensed under the Apache License, Version 2.0 (the "License");
 */

function objectExtend(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

function extractExceptionMessage(ex) {
    if (ex == null) return "null exception";
    if (ex.message != null) return ex.message;
    if (ex.toString && ex.toString() != null) return ex.toString();
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