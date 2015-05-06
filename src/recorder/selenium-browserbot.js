/*
* Copyright 2011 Software Freedom Conservancy
*  Licensed under the Apache License, Version 2.0 (the "License");
*/

var BrowserBot = function() {
    this.allowNativeXpath = true;
    this.xpathEvaluator = new XPathEvaluator('wgxpath');
    this.browserbot = this; // DGF for backwards compatibility
    var self = this;
    this._registerAllLocatorFunctions();
};

BrowserBot.prototype.getCurrentWindow = function() {};


/**
 * Find an element by css selector
 */
BrowserBot.prototype.locateElementByCss = function (locator, document) {
    var elements = eval_css(locator, document);
    if (elements.length != 0)
        return elements[0];
    return null;
};

/**
 * This function is responsible for mapping a UI specifier string to an element
 * on the page, and returning it. If no element is found, null is returned.
 * Returning null on failure to locate the element is part of the undocumented
 * API for locator strategies.
 */
BrowserBot.prototype.locateElementByUIElement = function(locator, inDocument) {
    // offset locators are delimited by "->", which is much simpler than the
    // previous scheme involving detecting the close-paren.
    var locators = locator.split(/->/, 2);
    
    var locatedElement = null;
    var pageElements = UIMap.getInstance()
        .getPageElements(locators[0], inDocument);
    
    if (locators.length > 1) {
        for (var i = 0; i < pageElements.length; ++i) {
            var locatedElements = eval_locator(locators[1], inDocument,
                pageElements[i]);
            if (locatedElements.length) {
                locatedElement = locatedElements[0];
                break;
            }
        }
    }
    else if (pageElements.length) {
        locatedElement = pageElements[0];
    }
    
    return locatedElement;
};

BrowserBot.prototype.locateElementByUIElement.prefix = 'ui';

// define a function used to compare the result of a close UI element
// match with the actual interacted element. If they are close enough
// according to the heuristic, consider them a match.
/**
 * A heuristic function for comparing a node with a target node. Typically the
 * node is specified in a UI element definition, while the target node is
 * returned by the recorder as the leaf element which had some event enacted
 * upon it. This particular heuristic covers the case where the anchor element
 * contains other inline tags, such as "em" or "img".
 *
 * @param node    the node being compared to the target node
 * @param target  the target node
 * @return        true if node equals target, or if node is a link
 *                element and target is its descendant, or if node has
 *                an onclick attribute and target is its descendant.
 *                False otherwise.
 */
BrowserBot.prototype.locateElementByUIElement.is_fuzzy_match = function(node, target) {
    try {
        var isMatch = (
            (node == target) ||
            ((node.nodeName == 'A' || node.onclick) && is_ancestor(node, target))
        );
        return isMatch;
    }
    catch (e) {
        return false;
    }
};


BrowserBot.prototype._registerAllLocatorFunctions = function() {
    // TODO - don't do this in the constructor - only needed once ever
    this.locationStrategies = {};
    for (var functionName in this) {
        var result = /^locateElementBy([A-Z].+)$/.exec(functionName);
        if (result !== null) {
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

/*
 * Finds an element recursively in frames and nested frames in the specified document, using various lookup protocols
 */
BrowserBot.prototype.findElementRecursive = function(locatorType, locatorString, inDocument, inWindow) {

    var element = this.findElementBy(locatorType, locatorString, inDocument, inWindow);
    if (element !== null) {
        return element;
    }

    for (var i = 0; i < inWindow.frames.length; i++) {
        // On some browsers, the document object is undefined for third-party
        // frames.  Make sure the document is valid before continuing.
        if (inWindow.frames[i].document) {
            element = this.findElementRecursive(locatorType, locatorString, inWindow.frames[i].document, inWindow.frames[i]);
            if (element !== null) {
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

    if (win === null || win === undefined) {
        win = this.getCurrentWindow();
    }
    var element = this.findElementRecursive(locator.type, locator.string, win.document, win);
    return element;
};

BrowserBot.prototype.findElement = function(locator, win) {
    var element = this.findElementOrNull(locator, win);
    if (element === null) { 
        throw new SeleniumError("Element " + locator + " not found");
    }
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
        element = eval(domTraversal);   // jshint ignore:line
    } catch (e) {
        return null;
    }

    if (!element) {
        return null;
    }

    return element;
};

BrowserBot.prototype.locateElementByDomTraversal.prefix = "dom";

/**
 * Finds an element identified by the xpath expression. Expressions _must_
 * begin with "//".
 */
BrowserBot.prototype.locateElementByXPath = function(xpath, inDocument, inWindow) {
    return this.xpathEvaluator.selectSingleNode(inDocument, xpath, null,
        inDocument.createNSResolver ?
          inDocument.createNSResolver(inDocument.documentElement) : this._namespaceResolver);
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

/****************** BROWSER-SPECIFIC FUNCTIONS ONLY AFTER THIS LINE *******************/

function MozillaBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(MozillaBrowserBot.prototype, BrowserBot.prototype);

function SafariBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(SafariBrowserBot.prototype, BrowserBot.prototype);

function OperaBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(OperaBrowserBot.prototype, BrowserBot.prototype);

function IEBrowserBot(frame) {
    BrowserBot.call(this, frame);
}
objectExtend(IEBrowserBot.prototype, BrowserBot.prototype);
