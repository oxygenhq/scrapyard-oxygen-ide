if (typeof(console) === 'undefined') {
    console = { log: function (logMsg) { } };
}

if (typeof(String.prototype.startsWith) === 'undefined')
{
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

if(typeof(String.prototype.trim) === 'undefined')
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

var BrowserVersion = function () {
    // http://stackoverflow.com/a/9851769/217039
    this.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    this.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    this.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    this.isChrome = !!window.chrome && !this.isOpera;              // Chrome 1+
    this.isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
    this.isIE9Quirks = this.isIE && document.compatMode === 'BackCompat';
};
var browserVersion = new BrowserVersion();