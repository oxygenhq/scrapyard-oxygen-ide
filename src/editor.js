/*
 * JavaScript Editor component.
 *
 *  NOTE: ext-language-tools.js needs to be patched to support autocomplete on dots '.'
 *        var ID_REGEX = /[a-zA-Z_0-9\$\-\u00A2-\uFFFF]/; 
 *        should be var ID_REGEX = /[a-zA-Z_0-9\.\$\-\u00A2-\uFFFF]/
 *        
 *        ext-language_tools.js also needs its sorting condition in this.setFilter changed to allow 
 *        proper alphabetical sorting:
 *
 *          matches = matches.sort(function(a, b) {
 *             return ((a.caption < b.caption) ? -1 : ((a.caption > b.caption) ? 1 : 0));
 *          });
 */ 

(function() {
    var __hasProp = {}.hasOwnProperty;
    var __extends = function(child,  parent) {  
        for(var key in parent) { 
            if (__hasProp.call(parent,  key)) {
                child[key] = parent[key];
            }
        } 
        function ctor() { 
            this.constructor = child; 
        } 
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;  
        return child;  
    };
    
    var Range, langTools; // need to be global in order to prevent GC
    
    var remote = require('electron').remote;
    var ipcRenderer = require('electron').ipcRenderer;
    require('./ace/ace');
    require('./ace/ext-language_tools');

    var Editor = (function(_super) {
        __extends(Editor, _super);

        /*
        * Section: Construction and Destruction
         */
     
        function Editor() {
        }
        
        Editor.prototype.attached = false;

        Editor.prototype.createdCallback = function() {
            this.attached = false;
            this.initializeContent();
        };

        Editor.prototype.attachedCallback = function() {
            this.attached = true;
        };

        Editor.prototype.detachedCallback = function() {
            this.attached = false;
        };

        Editor.prototype.initializeContent = function() {
            ace.config.set('basePath', 'ace');
            Range = ace.require('ace/range').Range;
            langTools = ace.require('ace/ext/language_tools');
            langTools.setCompleters(); // remove default completers
            var editor = this.editor = ace.edit(this);
            editor.$blockScrolling = Infinity;
            editor.setTheme('ace/theme/oxygen_dark');
            editor.getSession().setMode('ace/mode/javascript');
            editor.getSession().on('change', function() {
                var um = editor.getSession().getUndoManager();   
                if (!um.isClean()) {
                    toggleSave(true);
                    toogleUndoRedo(um);
                }
            });
            editor.selection.on('changeSelection', function() {
                toogleCutCopy(!editor.selection.isEmpty());
            });
            
            editor.setPrintMarginColumn(99);
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: false,
                enableLiveAutocompletion: true
            });

            var completer = {
                getCompletions: function (editor, session, pos, prefix, callback) {
                    if (prefix.length === 0)
                    {
                        callback(null, []);
                        return;
                    }

                    // generate suggestions
                    var suggestions;
                    var prefixTrimmed = prefix.replace(/\.$/, ''); // remove trailing dot
                    if (prefixTrimmed in docs) {    // we have documentation for this module
                        suggestions = docs[prefixTrimmed].methods.map(function(obj) { 
                            var name = prefixTrimmed + '.' + obj.getMethod();
                            return { caption: name, value: name + '()', score: '1' };
                        });          
                    } else {                        // retrieve all available modules
                        suggestions = [];
                        for (var moduleName in docs)
                        {
                            suggestions.push({ caption: moduleName, value: moduleName, score: '1' });
                        }
                    }
                    callback(null, suggestions);
              
                    if (typeof (editor.completer.popup) === 'undefined') {
                        return;
                    }

                    editor.completer.popup.on('changeHoverMarker', function (a) {
                        var row = editor.completer.popup.getHoveredRow();
                        var d;
                        if (row === -1) {
                            d = document.getElementById('apidoc');
                            d.style.display = 'none';
                            return;
                        }
                        
                        // generate apidoc
                        var APIDOC_TMPL = "<div class='name'>{0}({1})</div><div class='desc'>{2}</div>{3}{4}";
                        var APIDOC_TMPL_ARG_SECTION = "<div class='args'><div class='arg-title'>Arguments</div>{0}</div>";
                        var APIDOC_TMPL_ARG = "<div><code class='arg-name'>{0}</code><code class='arg-type'>{1}</code></div><div class='arg-body'>{2}</div>";
                        var APIDOC_TMPL_RETURN = "<div class='ret'><div class='ret-title'><span>Returns</span><code class='arg-type'>{0}</code></div><div>{1}</div></div>";
                
                        // find matching method doc
                        var fullMethodName = editor.completer.popup.getData(row).caption;
                        var tokens = fullMethodName.split('.');
                        var methodDoc;
                        var mod = docs[tokens[0]];
                        for (var method of mod.methods) {
                            if (method.getMethod() === tokens[1]) {
                                methodDoc = method;
                                break;
                            }
                        }
                        if (!methodDoc) {
                            return;
                        }
                        
                        // transform the content
                        var params = methodDoc.getParams();
                        var paramConcat = [];
                        var argsSegments = '';
                        for (var param of params)
                        {
                            paramConcat.push(param.name);
                            argsSegments += APIDOC_TMPL_ARG.format(param.name, 
                                                                    param.type, 
                                                                    param.description);
                        }
                        var ret = methodDoc.getReturn();

                        var apiDoc = APIDOC_TMPL.format(
                            methodDoc.getMethod(),
                            paramConcat.join(', '),
                            methodDoc.getSummary(),
                            params.length > 0 ? APIDOC_TMPL_ARG_SECTION.format(argsSegments) : '',
                            ret ? APIDOC_TMPL_RETURN.format(ret.type, ret.description) : ''
                        );

                        // show it
                        var left = parseFloat(editor.completer.popup.container.style.left);
                        var top = parseFloat(editor.completer.popup.container.style.top);
                        var width = editor.completer.popup.container.clientWidth;

                        d = document.getElementById('apidoc');
                        d.innerHTML = apiDoc;
                        d.style.position = 'absolute';
                        d.style.left = (left + width + 10) + 'px';
                        d.style.top = top + 'px';
                        d.style.display = 'block';
                    });
                }
            };
            langTools.addCompleter(completer);

            editor.on('guttermousedown', function (e) {
                var target = e.domEvent.target;
                if (target.className.indexOf('ace_gutter-cell') === -1 || 
                    e.clientX > 40 + target.getBoundingClientRect().left)
                    return;

                var row = e.getDocumentPosition().row;
                var bps = editor.session.getBreakpoints();

                if (bps.length < row || bps.length === 0 || bps[row] != 'ace_breakpoint') {
                    e.editor.session.setBreakpoint(row);
                    if (toolbar.testRunner) {
                        toolbar.testRunner.setBreakpoint(row);
                    }
                } else {
                    e.editor.session.clearBreakpoint(row);
                    if (toolbar.testRunner) {
                        toolbar.testRunner.clearBreakpoint(row);
                    }
                }

                e.stop();
            });
        };
        
        /*
         * Section: Utils
         */
         
        if (!String.prototype.format) {
            String.prototype.format = function() {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function(match, number) { 
                    return typeof args[number] != 'undefined' ? args[number] : match;
                });
            };
        }

        /*
         * Section: Methods
         */
     
        /**
         * Sets editor's content.
         * @param {string} data - Content to set.
         */
        Editor.prototype.setContent = function(data) {
            this.editor.setValue(data, -1);
            this.clearBreakpoints();
        };
        
        /**
         * Gets editor's content.
         * @return {string} Editor's content. 
         */
        Editor.prototype.getContent = function() {
            return this.editor.getValue();
        };
        
        /**
         * Appends text.
         * @param {string} data - Content to append.
         */
        Editor.prototype.appendText = function(data) {
            this.editor.navigateFileEnd();
            this.editor.insert(data);
            this.editor.centerSelection();
        };
    
        /**
         * Disables user interaction.
         */
        Editor.prototype.disable = function() {
            this.editor.setOptions({
                readOnly: true,
                highlightActiveLine: false,
                highlightGutterLine: false
            });
            this.editor.renderer.$cursorLayer.element.style.opacity = 0;
        };
    
        /**
         * Enables user interaction.
         */
        Editor.prototype.enable = function() {
            this.editor.setOptions({
                readOnly: false,
                highlightActiveLine: true,
                highlightGutterLine: true
            });
            this.editor.renderer.$cursorLayer.element.style.opacity = 1;
        };

        /**
         * Removes all breakpoints and line pointers if exist.
         */
        Editor.prototype.clearBreakpoints = function() {
            this.editor.session.clearBreakpoints();
            this.breakPoints = [];
            this.editor.session.removeMarker(this.lastMarker);
            this.editor.session.removeGutterDecoration(this.prevCurLine, 'current-line');
        };
        
        /**
         * Returns an array of numbers, indicating which rows have breakpoints.
         */
        Editor.prototype.getBreakpoints = function() {
            var bps = [];
            this.editor.session.getBreakpoints().forEach(
                function (value, i) {
                    if (value === 'ace_breakpoint') {
                        bps.push(i+1);
                    }
                });
            return bps;
        };
    
        /**
         * Highlights the specified line.
         * @param {Number} line - Index of the line to highlight.
         */
        Editor.prototype.setCmdHighlight = function(line) {
            this.editor.session.removeGutterDecoration(this.prevCurLine, 'current-line');
            this.editor.session.addGutterDecoration(line - 1, 'current-line');
            this.prevCurLine = line - 1;
            
            this.editor.session.removeMarker(this.lastMarker);
            this.editor.scrollToLine(line - 1, true, true, function() {});
        };

        /**
         * Sets breakpoint highlight for the specified line.
         * @param {Number} line - Index of the line to highlight.
         */
        Editor.prototype.setBpHighlight = function(line) {
            this.editor.session.removeGutterDecoration(this.prevCurLine, 'current-line');
            this.editor.session.addGutterDecoration(line - 1, 'current-line');
            this.prevCurLine = line - 1;

            this.editor.session.removeMarker(this.lastMarker);
            this.lastMarker = this.editor.session.addMarker(
                new Range(line - 1, 0, line - 1, 200), 
                'current-line-bp', 
                'background');
        };
        
        /**
         * Clear editor content.
         */
        Editor.prototype.new = function() {
            editor.setContent('');
            editor.currentFilename = null;
            // update main window title
            ipcRenderer.send('window.title:change', null);
        };

        /**
         * Open script.
         */
        Editor.prototype.open = function() {
            var file = remote.dialog.showOpenDialog(
                currentWin, 
                { 
                    properties: [ 'openFile', 'openFile' ],
                    filters: 
                    [
                        { name: 'JavaScript', extensions: ['js'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                }
            );
            if (file) {
                editor.currentFilename = file[0];
                // update main window title
                ipcRenderer.send('window.title:change', editor.currentFilename);
                fs.readFile(file[0], 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    // strip BOM before sending to the editor
                    editor.setContent(data.replace(/^\uFEFF/, ''));
                    toggleSave(false);
                });
            }
        };

        /**
         * Save the script.
         */
        Editor.prototype.save = function() {
            if (editor.currentFilename) {
                fs.writeFile(editor.currentFilename, editor.getContent(), function(err) {
                    if (!err) {
                        toggleSave(false);
                        remote.getCurrentWindow().menu.enable('Save', false);
                    }
                });
                return true;
            } else {
                return editor.saveAs();
            }
        };
        
        /**
         * Save the script as a new file.
         */
        Editor.prototype.saveAs = function() {
            var fileName = remote.dialog.showSaveDialog(
                remote.getCurrentWindow(),
                { filters: [{ name: 'JavaScript', extensions: ['js'] }] }
            );
            if (fileName) {
                editor.currentFilename = fileName;
                // update main window title
                ipcRenderer.send('window.title:change', editor.currentFilename);
                fs.writeFile(fileName, editor.getContent(), function(err) {
                    if (!err) {
                        toggleSave(false);
                        remote.getCurrentWindow().menu.enable('Save', false);
                    }
                });
                return true;
            } else {
                return false;
            }
        };
        
        /**
         * Removes current breakpoint highlight.
         */
        Editor.prototype.clearBpHighlight = function() {
            this.editor.session.removeMarker(this.lastMarker);
        };
        
        /**
         * Undo.
         */
        Editor.prototype.undo = function() {
            var um = this.editor.session.getUndoManager();
            um.undo();
            toogleUndoRedo(um);
        };
        
        /**
         * Redo.
         */
        Editor.prototype.redo = function() {
            var um = this.editor.session.getUndoManager();
            um.redo();
            toogleUndoRedo(um);
        };
        
        function toogleUndoRedo(um) {
            var menu = remote.getCurrentWindow().menu;
            
            var hasUndo = um.hasUndo();
            menu.enable('Undo', hasUndo);
            if (hasUndo) {
                toolbar.btnUndo.enable();
            } else {
                toolbar.btnUndo.disable();
            }
            
            var hasRedo = um.hasRedo();
            menu.enable('Redo', hasRedo);
            if (hasRedo) {
                toolbar.btnRedo.enable();
            } else {
                toolbar.btnRedo.disable();
            }
        }

        function toggleSave(enable) {
            if (enable) {
                toolbar.btnSave.enable();
            } else {
                toolbar.btnSave.disable();
            }
            var menu = remote.getCurrentWindow().menu;
            menu.enable('Save', enable);
        }
        
        function toogleCutCopy(enable) {
            var menu = remote.getCurrentWindow().menu;
            menu.enable('Cut', enable);
            menu.enable('Copy', enable);
            
            if (enable) {
                toolbar.btnCut.enable();
                toolbar.btnCopy.enable();
            } else {
                toolbar.btnCut.disable();
                toolbar.btnCopy.disable();
            }
        }
        return Editor;
    })(HTMLElement);

    module.exports = document.registerElement('cb-editor', {
        prototype: Editor.prototype,
        extends: 'div'
    });
}).call(this);