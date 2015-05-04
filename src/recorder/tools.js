/*
 * Copyright 2005 Shinya Kasatani
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

// IE fix. console doesn't exist unless dev toolbar is open
if (typeof(console) === "undefined") {
    console = { log: function (logMsg) { } };
}

if (typeof(String.prototype.startsWith) === "undefined")
{
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

Array.prototype["delete"] = function(value) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == value) {
            this.splice(i, 1);
            return true;
        }
    }
    return false;
};

// Samit: Ref: Split the fn to allow both objects of a class as well as the class itself to be notifiable as required
function observable(clazz) {
  classObservable(clazz.prototype);
}

function classObservable(clazz) {
    clazz.addObserver = function(observer) {
        if (!this.observers) this.observers = [];
        this.observers.push(observer);
    };

    clazz.removeObserver = function(observer) {
        if (!this.observers) return;
        this.observers["delete"](observer);
    };

    clazz.notify = function(event) {
        if (this.log) {
            console.log("notify " + event);
        }
        if (!this.observers) return;
        var args = [];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (var i = 0; i < this.observers.length; i++) {
            var observer = this.observers[i];
            if (observer[event]) {
                try {
                    observer[event].apply(observer, args);
                } catch(e) {
                    //continue with the rest even if one observer fails
                }
            }
        }
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

    if (this.isIE) {
        this.ieMode = document.documentMode;
        var self = this;
        try {
            if (window.top.document.location.pathname.match(/.hta$/i)) {
                this.isHTA = true;
            }
        } catch (e) {
            self.isHTA = false;
        }
    }
};
var browserVersion = new BrowserVersion();