/**
 * Collection of Selenium methods for browser automation.
 */
module.exports = function(execMethod) {
    var module = {};
    /**
     * *Documentation not available*
     * @function setBaseUrl
     */
    module.setBaseUrl = function() { return execMethod('web', 'setBaseUrl', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function transaction
     */
    module.transaction = function() { return execMethod('web', 'transaction', Array.prototype.slice.call(arguments)) };
    /**
     * Specifies the amount of time that Selenium will wait for actions to complete.
     * Actions that require waiting include "open" and the "waitFor*" actions.
     * The default timeout is 30 seconds.
     * @function setTimeout
     * @param {Number} timeout - A timeout in milliseconds, after which the action will return 
     *                           with an error.
     */
    module.setTimeout = function() { return execMethod('web', 'setTimeout', Array.prototype.slice.call(arguments)) };
    /**
     * Opens an URL in the test frame. This accepts both relative and absolute URLs.
     * The "open" command waits for the page to load before proceeding.
     * This command is a synonym for openAndWait.
     * @function open
     * @param {String} url - The URL to open; may be relative or absolute.
     */
    module.open = function() { return execMethod('web', 'open', Array.prototype.slice.call(arguments)) };
    /**
     * Opens an URL in the test frame. This accepts both relative and absolute URLs.
     * The "openAndWait" command waits for the page to load before proceeding.
     * This command is a synonym for open.
     * @function openAndWait
     * @param {String} url - The URL to open; may be relative or absolute.
     */
    module.openAndWait = function() { return execMethod('web', 'openAndWait', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function point
     */
    module.point = function() { return execMethod('web', 'point', Array.prototype.slice.call(arguments)) };
    /**
     * Clicks on a link, button, checkbox or radio button. If the click causes new page to load, the 
     * command waits for page to load before proceeding. This command is a synonym for clickAndWait.
     * @function click
     * @param {String} locator - An element locator.
     */
    module.click = function() { return execMethod('web', 'click', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function clickHidden
     */
    module.clickHidden = function() { return execMethod('web', 'clickHidden', Array.prototype.slice.call(arguments)) };
    /**
     * Clicks on a link, button, checkbox or radio button. If the click causes new page to load, the 
     * command waits for page to load before proceeding. This command is a synonym for click.
     * @function clickAndWait
     * @param {String} locator - An element locator.
     */
    module.clickAndWait = function() { return execMethod('web', 'clickAndWait', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertTitle
     */
    module.assertTitle = function() { return execMethod('web', 'assertTitle', Array.prototype.slice.call(arguments)) };
    /**
     * Sets the value of an input field, as though you typed it in.
     * @function type
     * @param {String} locator - An element locator.
     * @param {String} value - The value to type.
     */
    module.type = function() { return execMethod('web', 'type', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function clear
     */
    module.clear = function() { return execMethod('web', 'clear', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertText
     */
    module.assertText = function() { return execMethod('web', 'assertText', Array.prototype.slice.call(arguments)) };
    /**
     * Selects a popup window using a window locator; once a popup window has been selected, all
     * commands go to that window. To select the main window again, use null as the target.
     * @function selectWindow
     * @param {String} windowID - Window title, internal JavaScript "name," or JavaScript variable 
     *                            identifying the window.
     */
    module.selectWindow = function() { return execMethod('web', 'selectWindow', Array.prototype.slice.call(arguments)) };
    /**
     * Store value in a variable. This command is a synonym for storeExpression.
     * @function store
     * @param {String} expression - The value to store.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.store = function() { return execMethod('web', 'store', Array.prototype.slice.call(arguments)) };
    /**
     * Store value in a variable. This command is a synonym for store.
     * @function storeExpression
     * @param {String} expression - The value to store.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeExpression = function() { return execMethod('web', 'storeExpression', Array.prototype.slice.call(arguments)) };
    /**
     * Gets the value of an element attribute. The value of the attribute may differ across 
     * browsers (this is the case for the "style" attribute, for example).
     * @function storeAttribute
     * @param {String} attributeLocator - An element locator followed by an &#064; sign and then the 
     *                                    name of the attribute, e.g. "foo&#064;bar"
     */
    module.storeAttribute = function() { return execMethod('web', 'storeAttribute', Array.prototype.slice.call(arguments)) };
    /**
     * Gets the text of an element. This works for any element that contains text. This command uses
     * either the textContent (Mozilla-like browsers) or the innerText (IE-like browsers) of the 
     * element, which is the rendered text shown to the user.
     * @function storeText
     * @param {String} locator - An element locator.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeText = function() { return execMethod('web', 'storeText', Array.prototype.slice.call(arguments)) };
    /**
     * Gets the (whitespace-trimmed) value of an input field (or anything else with a value 
     * parameter). For checkbox/radio elements, the value will be "on" or "off" depending on
     * whether the element is checked or not.
     * @function storeValue
     * @param {String} locator - An element locator.
     * @param {String} variableName - The name of a variable in which the result is to be stored.
     */
    module.storeValue = function() { return execMethod('web', 'storeValue', Array.prototype.slice.call(arguments)) };
    /**
     * Double clicks on a link, button, checkbox or radio button.
     * @function doubleClick
     * @param {String} locator - An element locator.
     */
    module.doubleClick = function() { return execMethod('web', 'doubleClick', Array.prototype.slice.call(arguments)) };
    /**
     * Simulates keystroke events on the specified element, as though you typed the value key-by-key.
     * @function sendKeys
     * @param {String} locator - An element locator.
     * @param {String} value - The value to type.
     */
    module.sendKeys = function() { return execMethod('web', 'sendKeys', Array.prototype.slice.call(arguments)) };
    /**
     * Select an option from a drop-down using an option locator.
     * @function select
     * @param {String} selectLocator - An element locator identifying a drop-down menu.
     * @param {String} optionLocator - An option locator (a label by default).
     */
    module.select = function() { return execMethod('web', 'select', Array.prototype.slice.call(arguments)) };
    /**
     * Wait for the specified amount of time (in milliseconds).
     * @function pause
     * @param {Number} waitTime - The amount of time to sleep (in milliseconds)
     */
    module.pause = function() { return execMethod('web', 'pause', Array.prototype.slice.call(arguments)) };
    /**
     * Waits for a popup window to appear and load up.
     * @function waitForPopUp
     * @param {String} windowID - The JavaScript window "name" of the window that will appear 
     *                            (not the text of the title bar) If unspecified, or specified as 
     *                            "null", this command will wait for the first non-top window to 
     *                            appear.
     * @param {String} timeout - A timeout in milliseconds, after which the action will return with 
     *                           an error. If this value is not specified, the default Selenium      
     *                           timeout will be used. See the setTimeout() command.
     */
    module.waitForPopUp = function() { return execMethod('web', 'waitForPopUp', Array.prototype.slice.call(arguments)) };
    /**
     * Selects a frame within the current window (You may invoke this command multiple times to 
     * select nested frames). To select the parent frame, use "relative=parent" as a locator; 
     * to select the top frame, use "relative=top". You can also select a frame by its 0-based 
     * index number; e.g. "index=0" to select the first frame.
     * @function selectFrame
     * @param {String} locator - An element locator identifying a frame or iframe.
     */
    module.selectFrame = function() { return execMethod('web', 'selectFrame', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForVisible
     */
    module.waitForVisible = function() { return execMethod('web', 'waitForVisible', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForAllLinks
     */
    module.waitForAllLinks = function() { return execMethod('web', 'waitForAllLinks', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForElementPresent
     */
    module.waitForElementPresent = function() { return execMethod('web', 'waitForElementPresent', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForText
     */
    module.waitForText = function() { return execMethod('web', 'waitForText', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForNotText
     */
    module.waitForNotText = function() { return execMethod('web', 'waitForNotText', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForValue
     */
    module.waitForValue = function() { return execMethod('web', 'waitForValue', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForNotValue
     */
    module.waitForNotValue = function() { return execMethod('web', 'waitForNotValue', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertValue
     */
    module.assertValue = function() { return execMethod('web', 'assertValue', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertTextPresent
     */
    module.assertTextPresent = function() { return execMethod('web', 'assertTextPresent', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertElementPresent
     */
    module.assertElementPresent = function() { return execMethod('web', 'assertElementPresent', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function assertAlert
     */
    module.assertAlert = function() { return execMethod('web', 'assertAlert', Array.prototype.slice.call(arguments)) };
    /**
     * *Documentation not available*
     * @function waitForPageToLoad
     */
    module.waitForPageToLoad = function() { return execMethod('web', 'waitForPageToLoad', Array.prototype.slice.call(arguments)) };
    return module;
};