/*
 * Exposes module-* documentation as a map of JSON (Doctrine) objects.
 */ 
(function() {
    var fs = require('fs');
    var path = require('path');
    var doctrine = require('doctrine');
    var modPath = path.resolve(__dirname, 'node_modules/oxygen-cli/ox_modules');
    module.exports = {};

    var docs = {};
    
    /*
     * Loads up JSDoc comments from a module-*.js file and stores them in a JSON (Doctrine) form.
     */
    module.exports.load = function(file, loadDescription) {
        try {
            var data = fs.readFileSync(file, 'utf8');
            
            var regex = /(\/\*\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/g;

            var commentRaw;
            var comments = [];
            var commentParsed;
            var description;
            
            if (loadDescription) {
                commentRaw = regex.exec(data);
                commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
                description = commentParsed.description;
            } else {
                description = '';
            }
            
            while ((commentRaw = regex.exec(data)) !== null) {
                commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
                
                commentParsed.getMethod = function() {
                    for (var tag of this.tags)
                    {
                        if (tag.title === 'function') {
                            return tag.name;
                        }
                    }
                };
                commentParsed.getSummary = function() {
                    for (var tag of this.tags)
                    {
                        if (tag.title === 'summary') {
                            return tag.description.replace(/(\r\n|\n)/gm,'');
                        }
                    }
                };
                commentParsed.getDescription = function() {
                    for (var tag of this.tags)
                    {
                        if (tag.title === 'description') {
                            return tag.description.replace(/(\r\n|\n)/gm,''); 
                        }
                    }
                };
                commentParsed.getReturn = function() {
                    for (var tag of this.tags)
                    {
                        if (tag.title === 'return') {
                            return { 
                                description: tag.description.replace(/(\r\n|\n)/gm,''), 
                                type: tag.type.name 
                            };
                        }
                    }
                };
                commentParsed.getParams = function() {
                    var params = [];
                    for (var tag of this.tags)
                    {
                        if (tag.title === 'param') {
                             
                            var type;
                            if (tag.type.type === 'OptionalType') {
                                type = tag.type.expression.name;
                            } else {
                                type = tag.type.name;
                            }
                            
                            params.push({ 
                                description: tag.description.replace(/(\r\n|\n)/gm,''), 
                                name: tag.name, 
                                type: type 
                            });
                        }
                    }
                    return params;
                };
                if (typeof commentParsed.getMethod() !== 'undefined')
                    comments.push(commentParsed);
            }
            
            return {description: description.replace(/(\r\n|\n)/gm,''), methods: comments};
        } catch (exc) {       
            console.log('Unable to load/parse ' + file);
        }
    };

    /*
     * Loads all the required modules.
     */
    module.exports.init = function() {
        var modules = fs.readdirSync(modPath);
        for (var m of modules) {
            if (!m.startsWith('module-')) {
                continue;
            }
            var name = m.substring('module-'.length, m.length - '.js'.length);
            if (fs.lstatSync(path.join(modPath, m)).isFile() && m.endsWith('.js')) {
                var modDir = path.join(modPath, 'module-' + name);
                if (fs.existsSync(modDir)) {
                    var modDoc = this.load(path.join(modPath, m), true);
                    // load commands
                    var cmdsDir = path.join(modDir, 'commands');
                    var cmds = fs.readdirSync(cmdsDir);
                    for (var cmd of cmds) {
                        var cmdfile = path.join(cmdsDir, cmd);
                        if (fs.lstatSync(cmdfile).isFile() && cmd.endsWith('.js')) {
                            modDoc.methods = modDoc.methods.concat(this.load(cmdfile, false).methods);
                        }
                    }
                    docs[name] = modDoc;
                } else {
                    docs[name] = this.load(path.join(modPath, m), true);
                }
            } 
        }
        return docs;
    };
    
}).call(this);