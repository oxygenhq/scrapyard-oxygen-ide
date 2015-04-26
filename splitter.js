/*
 * Layout splitter.
 * Based on jquery.splitter by Dave Methvin (dave.methvin@gmail.com) http://www.methvin.com/splitter/
 *
 * Dual licensed under the MIT and GPL licenses: 
 *   http://www.opensource.org/licenses/mit-license.php 
 *   http://www.gnu.org/licenses/gpl.html 
 */
(function($){

$.fn.splitter = function(args){
    args = args || {};
    return this.each(function() {
        var zombie;        // left-behind splitbar for outline resizes
        function startSplitMouse(evt) {
            if ( opts.outline )
                zombie = zombie || bar.clone(false).insertAfter(A);
            bar.addClass(opts.activeClass);
            A._posSplit = A[0][opts.pxSplit] - evt[opts.eventPos];
            $(document).bind('mousemove', doSplitMouse).bind('mouseup', endSplitMouse);
        }
        function doSplitMouse(evt) {
            var newPos = A._posSplit+evt[opts.eventPos];
            if ( opts.outline ) {
                newPos = Math.max(0, Math.min(newPos, splitter._DA - bar._DA));
                bar.css(opts.origin, newPos);
            } else 
                resplit(newPos);
        }
        function endSplitMouse(evt) {
            bar.removeClass(opts.activeClass);
            var newPos = A._posSplit+evt[opts.eventPos];
            if ( opts.outline ) {
                zombie.remove(); zombie = null;
                resplit(newPos);
            }
            $(document).unbind('mousemove', doSplitMouse).unbind('mouseup', endSplitMouse);
        }
        function resplit(newPos) {
            // Constrain new splitbar position to fit pane size limits
            newPos = Math.max(A._min, splitter._DA - B._max, 
                    Math.min(newPos, A._max, splitter._DA - bar._DA - B._min));
            // Resize/position the two panes
            bar._DA = bar[0][opts.pxSplit];        // bar size may change during dock
            bar.css(opts.origin, newPos).css(opts.fixed, splitter._DF);
            A.css(opts.origin, 0).css(opts.split, newPos).css(opts.fixed,  splitter._DF);
            B.css(opts.origin, newPos+bar._DA)
                .css(opts.split, splitter._DA-bar._DA-newPos).css(opts.fixed,  splitter._DF);
            panes.trigger('splitresize');
        }
        function dimSum(jq, dims) {
            var sum = 0;
            for ( var i=1; i < arguments.length; i++ )
                sum += Math.max(parseInt(jq.css(arguments[i])), 0);
            return sum;
        }
        
        // Determine settings based on incoming opts, element classes, and defaults
        var vh = (args.splitHorizontal? 'h' : args.splitVertical? 'v' : args.type) || 'v';
        var opts = $.extend({
            activeClass: 'active',    // class name for active splitter
        },{
            v: {                    // Vertical splitters:
                cursor: 'e-resize',
                splitbarClass: 'vsplitbar', outlineClass: 'voutline',
                type: 'v', eventPos: 'pageX', origin: 'left',
                split: 'width',  pxSplit: 'offsetWidth',  side1: 'Left', side2: 'Right',
                fixed: 'height', pxFixed: 'offsetHeight', side3: 'Top',  side4: 'Bottom'
            },
            h: {                    // Horizontal splitters:
                cursor: 'n-resize',
                splitbarClass: 'hsplitbar', outlineClass: 'houtline',
                type: 'h', eventPos: 'pageY', origin: 'top',
                split: 'height', pxSplit: 'offsetHeight', side1: 'Top',  side2: 'Bottom',
                fixed: 'width',  pxFixed: 'offsetWidth',  side3: 'Left', side4: 'Right'
            }
        }[vh], args);

        // Create jQuery object closures for splitter and both panes
        var splitter = $(this).css({position: 'relative'});
        var panes = $('>*', splitter[0]).css({
            position: 'absolute',             // positioned inside splitter container
            'z-index': '1'                    // splitbar is positioned above
        });
        var A = $(panes[0]);        // left  or top
        var B = $(panes[1]);        // right or bottom

        // Splitbar element, can be already in the doc or we create one
        var bar = $(panes[2] || '<div></div>')
            .insertAfter(A).css('z-index', '100')
            .attr({'class': opts.splitbarClass, unselectable: 'on'})
            .css({position: 'absolute',    'user-select': 'none', '-webkit-user-select': 'none'})
            .bind('mousedown', startSplitMouse);
        // Use our cursor unless the style specifies a non-default cursor
        if ( /^(auto|default|)$/.test(bar.css('cursor')) )
            bar.css('cursor', opts.cursor);

        // Cache several dimensions for speed, rather than re-querying constantly
        bar._DA = bar[0][opts.pxSplit];
        splitter._PBF = $.boxModel? dimSum(splitter, 'border'+opts.side3+'Width', 'border'+opts.side4+'Width') : 0;
        splitter._PBA = $.boxModel? dimSum(splitter, 'border'+opts.side1+'Width', 'border'+opts.side2+'Width') : 0;
        A._pane = opts.side1;
        B._pane = opts.side2;
        $.each([A,B], function(){
            this._min = opts['min'+this._pane] || dimSum(this, 'min-'+opts.split);
            this._max = opts['max'+this._pane] || dimSum(this, 'max-'+opts.split) || 9999;
            this._init = opts['size'+this._pane]===true ?
                parseInt($.css(this[0],opts.split)) : opts['size'+this._pane];
        });
        
        // Determine initial position, get from cookie if specified
        var initPos = A._init;
        if ( !isNaN(B._init) )    // recalc initial B size as an offset from the top or left side
            initPos = splitter[0][opts.pxSplit] - splitter._PBA - B._init - bar._DA;
        if ( opts.cookie ) {
            if ( !$.cookie )
                alert('jQuery.splitter(): jQuery cookie plugin required');
            var ckpos = parseInt($.cookie(opts.cookie));
            if ( !isNaN(ckpos) )
                initPos = ckpos;
            $(window).bind('unload', function(){
                var state = String(bar.css(opts.origin));    // current location of splitbar
                $.cookie(opts.cookie, state, {expires: opts.cookieExpires || 365, 
                    path: opts.cookiePath || document.location.pathname});
            });
        }
        if ( isNaN(initPos) )    // King Solomon's algorithm
            initPos = Math.round((splitter[0][opts.pxSplit] - splitter._PBA - bar._DA)/2);

        // Resize event propagation and splitter sizing
        if ( opts.anchorToWindow ) {
            // Account for margin or border on the splitter container and enforce min height
            splitter._hadjust = dimSum(splitter, 'borderTopWidth', 'borderBottomWidth', 'marginBottom');
            splitter._hmin = Math.max(dimSum(splitter, 'minHeight'), 20);
            $(window).bind('resize', function(){
                var top = splitter.offset().top;
                var wh = $(window).height();
                splitter.css('height', Math.max(wh-top-splitter._hadjust, splitter._hmin)+'px');
                splitter.trigger('splitresize');
            });
        }
        else if ( opts.resizeToWidth ) {
            $(window).bind('resize', function(){
                splitter.trigger('resize'); 
            });
        }

        // Resize event handler; triggered immediately to set initial position
        splitter.bind('splitresize', function(e, size){
            // Custom events bubble in jQuery 1.3; don't get into a Yo Dawg
            if ( e.target != this ) return;
            // Determine new width/height of splitter container
            splitter._DF = splitter[0][opts.pxFixed] - splitter._PBF;
            splitter._DA = splitter[0][opts.pxSplit] - splitter._PBA;
            // Bail if splitter isn't visible or content isn't there yet
            if ( splitter._DF <= 0 || splitter._DA <= 0 ) return;
            // Re-divvy the adjustable dimension; maintain size of the preferred pane
            resplit(!isNaN(size)? size : (!(opts.sizeRight||opts.sizeBottom)? A[0][opts.pxSplit] :
                splitter._DA-B[0][opts.pxSplit]-bar._DA));
        }).trigger('splitresize' , [initPos]);
    });
};

})(jQuery);