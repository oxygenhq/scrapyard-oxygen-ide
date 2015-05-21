/**
 * Collection of Selenium methods for browser automation.
 */
module.exports = function(execMethod) {
    var module = {};
    /**
     * Sets base URL which can be used for relative navigation using the <code>open</code> command.
     * @function setBaseUrl
     * @param {String} url - The URL.
     */
    module.setBaseUrl = function() { return execMethod('web', 'setBaseUrl', Array.prototype.slice.call(arguments)); };
    /**
     * Opens new transaction. The transaction will persist till a new one is opened.
     * @function transaction
     * @param {String} transactionName - Transaction name.
     */
    module.transaction = function() { return execMethod('web', 'transaction', Array.prototype.slice.call(arguments)); };
    /**
     * Specifies the amount of time that Selenium will wait for actions to complete.
     * Actions that require waiting include <code>open</code> and the <code>waitFor*</code> actions.
     * The default timeout is 30 seconds.
     * @function setTimeout
     * @param {Number} timeout - A timeout in milliseconds, after which the action will return 
     *                           with an error.
     */
    module.setTimeout = function() { return execMethod('web', 'setTimeout', Array.prototype.slice.call(arguments)); };
    /**
     * Opens an URL.
     * The <code>open</code> command waits for the page to load before proceeding.
     * @function open
     * @param {String} url - The URL to open; may be relative or absolute.
     */
    module.open = function() { return execMethod('web', 'open', Array.prototype.slice.call(arguments)); };
    /**
     * Point the mouse cursor over the specified element.
     * @function point
     * @param {String} locator - An element locator.
     */
    module.point = function() { return execMethod('web', 'point', Array.prototype.slice.call(arguments)); };
    /**
     * Clicks on a link, button, checkbox, or radio button. If the click causes new page to load, the 
     * command waits for page to load before proceeding.
     * @function click
     * @param {String} locator - An element locator.
     */
    module.click = function() { return execMethod('web', 'click', Array.prototype.slice.call(arguments)); };
    /**
     * Clicks on a non-visible link, button, checkbox, or radio button. If the click causes new page 
     * to load, the command waits for page to load before proceeding.
     * @function clickHidden
     */
    module.clickHidden = function() { return execMethod('web', 'clickHidden', Array.prototype.slice.call(arguments)); };
    /**
     * *Documentation not available*
     * @function assertTitle
     * @param {String} locator - An element locator.
     */
    module.assertTitle = function() { return execMethod('web', 'assertTitle', Array.prototype.slice.call(arguments)); };
    /**
     * Sets the value of an input field, as though you typed it in.
     * @function type
     * @param {String} locator - An element locator.
     * @param {String} value - The value to type.
     */
    module.type = function() { return execMethod('web', 'type', Array.prototype.slice.call(arguments)); };
    /**
     * Clear the value of an input field.
     * @function clear
     * @param {String} locator - An element locator.
     */
    module.clear = function() { return execMethod('web', 'clear', Array.prototype.slice.call(arguments)); };
    /**
     * Asserts element's text.
     * @function assertText
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.assertText = function() { return execMethod('web', 'assertText', Array.prototype.slice.call(arguments)); };
    /**
     * Selects a popup window using a window locator; once a popup window has been selected, all
     * commands go to that window. To select the main window again, use null as the target.
     * @function selectWindow
     * @param {String} windowID - Window title or internal JavaScript "name".
     */
    module.selectWindow = function() { return execMethod('web', 'selectWindow', Array.prototype.slice.call(arguments)); };
    /**
     * Stores value in a Selenium variable.
     * @function store
     * @param {String} expression - The value to store.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.store = function() { return execMethod('web', 'store', Array.prototype.slice.call(arguments)); };
    /**
     * Stores the value of an element attribute in a Selenium variable.
     * @function storeAttribute
     * @param {String} attributeLocator - An element locator followed by an &#064; sign and then the 
     *                                    name of the attribute, e.g. "foo&#064;bar"
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeAttribute = function() { return execMethod('web', 'storeAttribute', Array.prototype.slice.call(arguments)); };
    /**
     * Stores the text (rendered text shown to the user) of an element in a Selenium variable. This 
     * works for any element that contains text.
     * @function storeText
     * @param {String} locator - An element locator.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeText = function() { return execMethod('web', 'storeText', Array.prototype.slice.call(arguments)); };
    /**
     * Stores the (whitespace-trimmed) value of an input field (or anything else with a value 
     * parameter) in a Selenium variable. For checkbox/radio elements, the value will be "on" or 
     * "off".
     * @function storeValue
     * @param {String} locator - An element locator.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeValue = function() { return execMethod('web', 'storeValue', Array.prototype.slice.call(arguments)); };
    /**
     * Double clicks on a link, button, checkbox, or radio button.
     * @function doubleClick
     * @param {String} locator - An element locator.
     */
    module.doubleClick = function() { return execMethod('web', 'doubleClick', Array.prototype.slice.call(arguments)); };
    /**
     * Simulates keystroke events on the specified element, as though you typed the value key-by-key.
     * @function sendKeys
     * @param {String} locator - An element locator.
     * @param {String} value - The value to type.
     */
    module.sendKeys = function() { return execMethod('web', 'sendKeys', Array.prototype.slice.call(arguments)); };
    /**
     * Selects an option from a drop-down using an option locator.
     * @function select
     * @param {String} selectLocator - An element locator identifying a drop-down menu.
     * @param {String} optionLocator - An option locator (a label by default).
     */
    module.select = function() { return execMethod('web', 'select', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for the specified amount of time (in milliseconds).
     * @function pause
     * @param {Number} waitTime - The amount of time to sleep (in milliseconds)
     */
    module.pause = function() { return execMethod('web', 'pause', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for a popup window to appear and load up.
     * @function waitForPopUp
     * @param {String} windowID - The JavaScript window "name" of the window that will appear (not 
     *                            the title bar). If unspecified, or specified as "null", this 
     *                            command will wait for the first non-top window to appear.
     * @param {String} timeout - A timeout in milliseconds, after which the action will return with 
     *                           an error. If this value is not specified, the default Selenium      
     *                           timeout will be used. See the <code>setTimeout</code> command.
     */
    module.waitForPopUp = function() { return execMethod('web', 'waitForPopUp', Array.prototype.slice.call(arguments)); };
    /**
     * Selects a frame within the current window (You may invoke this command multiple times to 
     * select nested frames). To select the parent frame, use "relative=parent" as a locator; 
     * to select the top frame, use "relative=top". You can also select a frame by its 0-based 
     * index number; e.g. "index=0" to select the first frame.
     * @function selectFrame
     * @param {String} locator - An element locator identifying a frame or an iframe.
     */
    module.selectFrame = function() { return execMethod('web', 'selectFrame', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for element to become visible.
     * @function waitForVisible
     * @param {String} locator - An element locator.
     */
    module.waitForVisible = function() { return execMethod('web', 'waitForVisible', Array.prototype.slice.call(arguments)); };
    /**
     * *Documentation not available*
     * @function waitForAllLinks
     */
    module.waitForAllLinks = function() { return execMethod('web', 'waitForAllLinks', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for element to appear in the DOM. The element might be visible to the user or not.
     * @function waitForElementPresent
     * @param {String} locator - An element locator.
     */
    module.waitForElementPresent = function() { return execMethod('web', 'waitForElementPresent', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for inner text of the given element to match the specified pattern.
     * @function waitForText
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.waitForText = function() { return execMethod('web', 'waitForText', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for inner text of the given element to stop matching the specified pattern.
     * @function waitForNotText
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.waitForNotText = function() { return execMethod('web', 'waitForNotText', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for input element's (or anything else with a value parameter) value to match the 
     * specified pattern.
     * @function waitForValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.waitForValue = function() { return execMethod('web', 'waitForValue', Array.prototype.slice.call(arguments)); };
    /**
     * Waits for input element's (or anything else with a value parameter) value to stop matching 
     * the specified pattern.
     * @function waitForNotValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.waitForNotValue = function() { return execMethod('web', 'waitForNotValue', Array.prototype.slice.call(arguments)); };
    /**
     * Asserts element's value.
     * @function assertValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Value pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.assertValue = function() { return execMethod('web', 'assertValue', Array.prototype.slice.call(arguments)); };
    /**
     * Asserts whether the given text present somewhere on the page. That is whether an element 
     * containing this text exists.
     * @function assertTextPresent
     * @param {String} text - Text.
     */
    module.assertTextPresent = function() { return execMethod('web', 'assertTextPresent', Array.prototype.slice.call(arguments)); };
    /**
     * Asserts whether element exists in the DOM.
     * @function assertElementPresent
     * @param {String} locator - An element locator.
     */
    module.assertElementPresent = function() { return execMethod('web', 'assertElementPresent', Array.prototype.slice.call(arguments)); };
    /**
     * Asserts whether alert matches the specified pattern and dismisses it.
     * @function assertAlert
     * @param {String} pattern - Text pattern. Supported prefixes: <code>regexp</code>, 
     *                           <code>regexpi</code>, <code>exact</code>, <code>glob</code>.
     */
    module.assertAlert = function() { return execMethod('web', 'assertAlert', Array.prototype.slice.call(arguments)); };

    return module;
};