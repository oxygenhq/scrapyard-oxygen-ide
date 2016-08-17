/*
 * Exposes module-* documentation as a map of JSON (Doctrine) objects.
 */ 
(function() {
    var fs = require('fs');
    var path = require('path');
    var doctrine = require('doctrine');
    var modPath = path.resolve(__dirname, 'node_modules/oxygen/ox_modules');
    var exports = module.exports = {};

    var docs = {};
    
    /*
     * Loads up JSDoc comments from a module-*.js file and stores them in a JSON (Doctrine) form.
     */
    module.exports.load = function(moduleName) {
        var file = path.join(modPath, moduleName);
        fs.readFile(file, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);        // FIXME: proper error handling
            }
         
            var regex = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/g;

            var commentRaw;
            var comments = [];
            var commentParsed;
            
            commentRaw = regex.exec(data);
            commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
            var description = commentParsed.description;
            
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
            
            var name = moduleName.substring('module-'.length, moduleName.length - '.js'.length);
            docs[name] = {description: description.replace(/(\r\n|\n)/gm,''), methods: comments};
        });
    };

    /*
     * Loads all the required modules.
     */
    module.exports.init = function() {
        var modules = fs.readdirSync(modPath);
        for (var m of modules) {
            if (m.startsWith('module-') && m.endsWith('.js')) {
                this.load(m);
            }
        }
        return docs;
    };
    
}).call(this);