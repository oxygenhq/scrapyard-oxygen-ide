ace.define("ace/theme/cloudbeat_dark",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-cloudbeat-dark";
exports.cssText = ".ace-cloudbeat-dark .ace_gutter {\
background: #22252b;\
color: #595959;\
border-right: 1px solid #282828;\
}\
.ace-cloudbeat-dark .ace_gutter-cell.ace_warning {\
background-image: none;\
background: #FC0;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-cloudbeat-dark .ace_gutter-cell.ace_error {\
background-position: -6px center;\
background-image: none;\
background: #F10;\
border-left: none;\
padding-left: 0;\
color: #000;\
}\
.ace-cloudbeat-dark .ace_print-margin {\
border-left: 1px solid #555;\
right: 0;\
background: #303338;\
}\
.ace-cloudbeat-dark {\
background-color: #303338;\
color: #E6E1DC;\
}\
.ace-cloudbeat-dark .ace_cursor {\
border-left: 2px solid #FFFFFF;\
}\
.ace-cloudbeat-dark .ace_cursor.ace_overwrite {\
border-left: 0px;\
border-bottom: 1px solid #FFFFFF;\
}\
.ace-cloudbeat-dark .ace_marker-layer .ace_selection {\
background: #494836;\
}\
.ace-cloudbeat-dark .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174);\
}\
.ace-cloudbeat-dark .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #FCE94F;\
}\
.ace-cloudbeat-dark .ace_marker-layer .ace_active-line {\
background: #333;\
}\
.ace-cloudbeat-dark .ace_gutter-active-line {\
background-color: #222;\
}\
.ace-cloudbeat-dark .ace_invisible {\
color: #404040;\
}\
.ace-cloudbeat-dark .ace_keyword {\
color:#00698F;\
}\
.ace-cloudbeat-dark .ace_keyword.ace_operator {\
color:#FF308F;\
}\
.ace-cloudbeat-dark .ace_constant {\
color:#1EDAFB;\
}\
.ace-cloudbeat-dark .ace_constant.ace_language {\
color:#FDC251;\
}\
.ace-cloudbeat-dark .ace_constant.ace_library {\
color:#8DFF0A;\
}\
.ace-cloudbeat-dark .ace_constant.ace_numeric {\
color:#58C554;\
}\
.ace-cloudbeat-dark .ace_invalid {\
color:#FFFFFF;\
background-color:#990000;\
}\
.ace-cloudbeat-dark .ace_invalid.ace_deprecated {\
color:#FFFFFF;\
background-color:#990000;\
}\
.ace-cloudbeat-dark .ace_support {\
color: #999;\
}\
.ace-cloudbeat-dark .ace_support.ace_function {\
color:#00AEEF;\
}\
.ace-cloudbeat-dark .ace_function {\
color:#00AEEF;\
}\
.ace-cloudbeat-dark .ace_string {\
color:#58C554;\
}\
.ace-cloudbeat-dark .ace_comment {\
color:#555;\
font-style:italic;\
padding-bottom: 0px;\
}\
.ace-cloudbeat-dark .ace_variable {\
color:#997744;\
}\
.ace-cloudbeat-dark .ace_meta.ace_tag {\
color:#BE53E6;\
}\
.ace-cloudbeat-dark .ace_entity.ace_other.ace_attribute-name {\
color:#FFFF89;\
}\
.ace-cloudbeat-dark .ace_markup.ace_underline {\
text-decoration: underline;\
}\
.ace-cloudbeat-dark .ace_fold-widget {\
text-align: center;\
}\
.ace-cloudbeat-dark .ace_fold-widget:hover {\
color: #777;\
}\
.ace-cloudbeat-dark .ace_fold-widget.ace_start,\
.ace-cloudbeat-dark .ace_fold-widget.ace_end,\
.ace-cloudbeat-dark .ace_fold-widget.ace_closed{\
background: none;\
border: none;\
box-shadow: none;\
}\
.ace-cloudbeat-dark .ace_fold-widget.ace_start:after {\
content: '▾'\
}\
.ace-cloudbeat-dark .ace_fold-widget.ace_end:after {\
content: '▴'\
}\
.ace-cloudbeat-dark .ace_fold-widget.ace_closed:after {\
content: '‣'\
}\
.ace-cloudbeat-dark .ace_indent-guide {\
border-right:1px dotted #333;\
margin-right:-1px;\
}\
.ace-cloudbeat-dark .ace_fold { \
background: #222; \
border-radius: 3px; \
color: #7AF; \
border: none; \
}\
.ace-cloudbeat-dark .ace_fold:hover {\
background: #CCC; \
color: #000;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);

});
