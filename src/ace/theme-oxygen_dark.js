ace.define("ace/theme/oxygen_dark",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-oxygen-dark";
exports.cssText = ".ace-oxygen-dark .ace_gutter {\
background: #242424;\
color: #595959;\
border-right: 1px solid #282828;\
}\
.ace-oxygen-dark .ace_gutter-cell.ace_warning {\
background-image: none;\
background: #FC0;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-oxygen-dark .ace_gutter-cell.ace_error {\
background-position: -6px center;\
background-image: none;\
background: #F10;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-oxygen-dark .ace_print-margin {\
border-left: 1px dotted #383838;\
right: 0;\
background: #242424;\
}\
.ace-oxygen-dark {\
background-color: #242424;\
color: #E6E1DC;\
}\
.ace-oxygen-dark .ace_cursor {\
border-left: 2px solid #FFFFFF;\
}\
.ace-oxygen-dark .ace_cursor.ace_overwrite {\
border-left: 0px;\
border-bottom: 1px solid #FFFFFF;\
}\
.ace-oxygen-dark .ace_marker-layer .ace_selection {\
background: #898941;\
}\
.ace-oxygen-dark .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174);\
}\
.ace-oxygen-dark .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #FCE94F;\
}\
.ace-oxygen-dark .ace_marker-layer .ace_active-line {\
background: #333;\
}\
.ace-oxygen-dark .ace_gutter-active-line {\
background-color: #222;\
}\
.ace-oxygen-dark .ace_invisible {\
color: #404040;\
}\
.ace-oxygen-dark .ace_keyword {\
color:#8ac6f2;\
}\
.ace-oxygen-dark .ace_storage {\
color:#8ac6f2;\
}\
.ace-oxygen-dark .ace_transaction {\
font-weight: bold;\
text-decoration: underline;\
color: #c4a433;\
}\
.ace-oxygen-dark .ace_keyword.ace_operator {\
color:#f3f6ee;\
}\
.ace-oxygen-dark .ace_constant {\
color:#1EDAFB;\
}\
.ace-oxygen-dark .ace_constant.ace_language {\
color:#f08080;\
}\
.ace-oxygen-dark .ace_constant.ace_library {\
color:#8DFF0A;\
}\
.ace-oxygen-dark .ace_constant.ace_numeric {\
color:#f08080;\
}\
.ace-oxygen-dark .ace_invalid {\
color:#f3f6ee;\
background-color:#990000;\
}\
.ace-oxygen-dark .ace_invalid.ace_deprecated {\
color:#f3f6ee;\
background-color:#990000;\
}\
.ace-oxygen-dark .ace_support {\
color: #999;\
}\
.ace-oxygen-dark .ace_support.ace_function {\
}\
.ace-oxygen-dark .ace_function {\
}\
.ace-oxygen-dark .ace_string {\
color:#cae682;\
}\
.ace-oxygen-dark .ace_comment {\
color:#99968b;\
padding-bottom: 0px;\
}\
.ace-oxygen-dark .ace_variable {\
color:#D4C4A9;\
}\
.ace-oxygen-dark .ace_meta.ace_tag {\
color:#BE53E6;\
}\
.ace-oxygen-dark .ace_entity.ace_other.ace_attribute-name {\
color:#FFFF89;\
}\
.ace-oxygen-dark .ace_markup.ace_underline {\
text-decoration: underline;\
}\
.ace-oxygen-dark .ace_fold-widget {\
text-align: center;\
}\
.ace-oxygen-dark .ace_fold-widget:hover {\
color: #777;\
}\
.ace-oxygen-dark .ace_fold-widget.ace_start,\
.ace-oxygen-dark .ace_fold-widget.ace_end,\
.ace-oxygen-dark .ace_fold-widget.ace_closed{\
background: none;\
border: none;\
box-shadow: none;\
}\
.ace-oxygen-dark .ace_fold-widget.ace_start:after {\
content: '▾'\
}\
.ace-oxygen-dark .ace_fold-widget.ace_end:after {\
content: '▴'\
}\
.ace-oxygen-dark .ace_fold-widget.ace_closed:after {\
content: '‣'\
}\
.ace-oxygen-dark .ace_indent-guide {\
}\
.ace-oxygen-dark .ace_fold { \
background: #222; \
border-radius: 3px; \
color: #7AF; \
border: none; \
}\
.ace-oxygen-dark .ace_fold:hover {\
background: #CCC; \
color: #000;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);

});
