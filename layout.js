//https://github.com/lexmihaylov/jquery.ui.layout

(function($) {
// Layout Class
var Layout = function(selector, options) {
    this.push($(selector).get(0));
    this.constructor = jQuery;
    
    this.addClass('ui-layout');
    
    if(options === null) {
        options = {};
    }
    
    this.options = {
        resizable: false,
        helper: false,
        type: 'vertical'
    };
    
    this._panes = [];
    
    this.options = $.extend(this.options, options);
    
    if(this.options.type == 'horizontal') {
        this.addClass('ui-layout-horizontal');
    } else {
        this.addClass('ui-layout-vertical');
    }
};

jQuery.extend(Layout.prototype, jQuery.prototype);

Layout.prototype.initialize = function() {
    if(this.options.type == 'horizontal') {
        this.setupHorizontalPanes();
    } else {
        this.setupVerticalPanes();
    }
    
    if(this.options.resizable) {
        if(this.options.type == 'horizontal') {
            this.horizontalResizable();
        } else {
            this.verticalResizable();
        }
    }
};

Layout.prototype.verticalResizable = function() {
    var panes = this.getPanes();
    if(panes) {
        for(var i = 0; i < panes.length - 1; i++) {
            this.initVerticalResizablePanes(panes[i], panes[i+1]);
        }
    }
};

Layout.prototype.horizontalResizable = function() {
    var panes = this.getPanes();
    if(panes) {
        for(var i = 0; i < panes.length - 1; i++) {
            this.initHorizontalResizablePanes(panes[i], panes[i+1]);
        }
    }
};

Layout.prototype.initVerticalResizablePanes = function (pane, relativePane) {
    var resizableOptions = {
        handles: "e"
    };
    
    if(this.options.helper) {
        resizableOptions.helper = this.options.helper;
    }
    
    pane.resizable(resizableOptions);
            
    var initialWidth = null;
    
    pane.on('resizestart', this, function(e) {
        initialWidth = pane.width();
        
        e.data.calculateVerticalResizeConstrains(pane, relativePane);
    });

    pane.on('resize', this, function() {
        var resizedWidth = initialWidth - pane.width();
        var newWidth = relativePane.width() + resizedWidth;
        relativePane.width(newWidth);

        initialWidth = pane.width();
    });
    
    pane.on('resizestop', this, function(e) {
        if(e.data.options.helper) {
            pane.trigger('resize');
        }
        
        var panePercentageWidth = 100*pane.width()/e.data.width();
        var relativePanePercentageWidth = 100*relativePane.width()/e.data.width();
        
        pane.width(panePercentageWidth+'%');
        pane.height('100%');
        relativePane.width(relativePanePercentageWidth+'%');
        relativePane.height('100%');
    });
};

Layout.prototype.calculateVerticalResizeConstrains = function(pane, relativePane) {
    var defaultValue = pane.width() + relativePane.outerWidth() - relativePane.minWidth(),
        maxWidth = pane.maxWidth();
    
    if(!maxWidth) {
        maxWidth  = defaultValue;
    } else {
        if(maxWidth > defaultValue) {
            maxWidth = maxWidth - (maxWidth - defaultValue);
        }
    }
    
    pane.resizable('option', 'maxWidth', maxWidth);
    
    if(pane.minWidth() > maxWidth) {
        pane.resizable('option', 'minWidth', maxWidth);
    } else {
        pane.resizable('option', 'minWidth', pane.minWidth());
    }
    
    return this;
};

Layout.prototype.initHorizontalResizablePanes = function (pane, relativePane) {
    var resizableOptions = {
        handles: "s"
    };
    
    if(this.options.helper) {
        resizableOptions.helper = this.options.helper;
    }
    
    pane.resizable(resizableOptions);
            
    var initialHeight = null;
            
    pane.on('resizestart', this, function(e) {
        initialHeight = pane.height();
        
        e.data.calculateHorizontalResizeConstrains(pane, relativePane);
    });

    pane.on('resize', this, function() {
        var resizedHeight = initialHeight - pane.height();
        var newHeight = relativePane.height() + resizedHeight;
        relativePane.height(newHeight);

        initialHeight = pane.height();
    });
    
    pane.on('resizestop', this, function(e) {
        if(e.data.options.helper) {
            pane.trigger('resize');
        }
        
        var panePercentageHeight = 100*pane.height()/e.data.height();
        var relativePanePercentageHeight = 100*relativePane.height()/e.data.height();
        
        pane.height(panePercentageHeight+'%');
        pane.width('100%');
        relativePane.height(relativePanePercentageHeight+'%');
        relativePane.width('100%');
    });
};

Layout.prototype.calculateHorizontalResizeConstrains = function(pane, relativePane) {
    var defaultValue = pane.height() + relativePane.outerHeight() - relativePane.minHeight(),
        maxHeight = pane.maxHeight();
    
    if(!maxHeight) {
        maxHeight  = defaultValue;
    } else {
        if(maxHeight > defaultValue) {
            maxHeight = maxHeight - (maxHeight - defaultValue);
        }
    }
    
    pane.resizable('option', 'maxHeight', maxHeight);
    
    if(pane.minHeight() > maxHeight) {
        pane.resizable('option', 'minHeight', maxHeight);
    } else {
        pane.resizable('option', 'minHeight', pane.minHeight());
    }
    
    return this;
};

Layout.prototype.setupWrapper = function(wrapper) {
    var resizeWrapper = function() {
        wrapper.width(wrapper.parent().width() - (wrapper.outerWidth(true) - wrapper.width()));
        wrapper.height(wrapper.parent().height() - (wrapper.outerHeight(true) - wrapper.height()));
    };
    
    resizeWrapper();
    $(window).on('resize', resizeWrapper);
};

Layout.prototype.setupVerticalPanes = function() {
    var panes = this.getPanes();    
    
    if(panes) {
        var fittingArea = this.width();
        var notSized = [];
        for(var i in panes) {
            
            var paneWidth = panes[i].width();
            
            if(paneWidth > 0) {
                fittingArea -= paneWidth;
                
                paneWidth = 100 *  paneWidth / this.width();
                
                panes[i].width(paneWidth+'%');
            } else {
                notSized.push(panes[i]);
            }
            
            panes[i].height('100%');
            panes[i].initialize();
            
            this.setupWrapper(panes[i].find('.ui-layout-pane-wrapper'));
        }
        
        if(notSized.length > 0) {
            var defaultPaneWidth = fittingArea/notSized.length;

            for(i in notSized) {
                paneWidth = 100 * defaultPaneWidth / this.width();
                notSized[i].width( paneWidth +'%' );
            }
        } else {
            var lastPane = panes[panes.length - 1];
            paneWidth = 100 * (fittingArea + lastPane.width()) / this.width();
            lastPane.width(paneWidth + '%');
        }
        
        this.trigger('resize');
    }
};

Layout.prototype.setupHorizontalPanes = function() {
    var panes = this.getPanes();
    
    if(panes) {
        var fittingArea = this.height();
        var notSized = [];
        
        for(var i in panes) {
            var paneHeight = panes[i].height();
            
            if(paneHeight > 0) {
                fittingArea -= paneHeight;
                
                paneHeight = 100 *  paneHeight / this.height();
                
                panes[i].height(paneHeight+'%');
            } else {
                notSized.push(panes[i]);
            }
            
            panes[i].width('100%');
            panes[i].initialize();
            
            this.setupWrapper(panes[i].find('.ui-layout-pane-wrapper'));
        }
        
        if(notSized.length > 0) {
            var defaultPaneHeight = fittingArea/notSized.length;

            for(i in notSized) {
                paneHeight = 100 * defaultPaneHeight / this.height();
                notSized[i].height( paneHeight +'%' );
            }
        } else {
            var lastPane = panes[panes.length - 1];
            paneHeight = 100 * (fittingArea + lastPane.height()) / this.height();
            lastPane.height(paneHeight + '%');
        }
        
        this.trigger('resize');
    }
};

Layout.prototype.addPane = function(pane) {
    this._panes.push(pane);
};

Layout.prototype.getPanes = function() {
    return this._panes;
};


// Pane Class
var Pane = function(selector) {
    this.push($(selector).get(0));
    this.constructor = jQuery;
    
    this._minWidth = 50;
    this._minHeight = 50;
    this._maxWidth = false;
    this._maxHeight = false;
    
    this.initialize();
    
    this.html('<div class="ui-layout-pane-wrapper">'+this.html()+'</div>');
};

jQuery.extend(Pane.prototype, jQuery.prototype);

Pane.prototype.initialize = function() {
    this.addClass('ui-layout-pane');
    
    this.css({
        'float': 'left',
        'padding': 0,
        'margin': 0,
        'border': 'none'
    });
};

Pane.prototype.computedWidth = function() {
    return parseFloat(window.getComputedStyle(this.get(0), null).getPropertyValue("width"));
};

Pane.prototype.computedHeight = function() {
    return parseFloat(window.getComputedStyle(this.get(0), null).getPropertyValue("height"));
};

Pane.prototype.width = function(value) {
    if(value) {
        jQuery.prototype.width.call(this, value);
        return this;
    }
    
    return this.computedWidth();
};

Pane.prototype.height = function(value) {
    if(value) {
        jQuery.prototype.height.call(this, value);
        return this;
    }
    
    return this.computedHeight();
};

Pane.prototype.minWidth = function(value) {
    if(value) {
        value = parseFloat(value);
        this._minWidth = value;
        
        return this;
    }
    
    return this._minWidth;
};

Pane.prototype.minHeight = function(value) {
    if(value) {
        value = parseFloat(value);
        this._minHeight = value;
        
        return this;
    }
    
    return this._minHeight;
};

Pane.prototype.maxWidth = function(value) {
    
    if(value) {
        value = parseFloat(value);
        this._maxWidth = value;
        return this;
    }
    
    return this._maxWidth;
};

Pane.prototype.maxHeight = function(value) {
    if(value) {
        value = parseFloat(value);
        this._maxHeight = value;
        
        return this;
    }
    
    return this._maxHeight;
};

if (!window.getComputedStyle) {
    window.getComputedStyle = function(el, pseudo) {
        this.el = el;
        this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        };
        return this;
    };
}

// JQuery Plugin
    $.fn.layout = function(options) {
        var $this = $(this);
        
        var config = {
            type: 'vertical',
            resizable: false,
            helper: false,
            panes: []
        };
        
        if(!options) {
            options = {};
        }
        
        config = $.extend(config, options);
        
        var layout = new Layout($this,{
            type: config.type,
            resizable: config.resizable,
            helper: config.helper
        });
        
        for(var i = 0; i < config.panes.length; i++) {
            var paneOptions = config.panes[i];
            
            var pane = new Pane(paneOptions[0]);
            
            if(paneOptions[1]) {
                if(layout.options.type == 'horizontal') {
                    if(paneOptions[1].minHeight) {
                        pane.minHeight(paneOptions[1].minHeight);
                    }
                    
                    if(paneOptions[1].maxHeight) {
                        pane.maxHeight(paneOptions[1].maxHeight);
                    }
                } else {
                    if(paneOptions[1].minWidth) {
                        pane.minWidth(paneOptions[1].minWidth);
                    }
                    
                    if(paneOptions[1].maxWidth) {
                        pane.maxWidth(paneOptions[1].maxWidth);
                    }
                }
            }
            
            layout.addPane(pane);
        }
        
        layout.initialize();
        
        return $this;
    };
})(jQuery);

