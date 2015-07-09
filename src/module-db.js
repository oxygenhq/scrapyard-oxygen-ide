/**
 * Provides methods for working with Data Bases through ODBC.
 */
module.exports = function(execMethod) {
    var module = {};
    /**
    * @summary Stores DB connection string to be used by other methods. 
    * @description This method doesn't actually open the connection as it's opened/closed 
    *               automatically by query methods.<br/>
    *               Example connection string: <code>Driver={MySQL ODBC 5.3 UNICODE Driver};
    *               Server=localhost;Database=myDatabase;User=myUsername;Password=myPassword;
    *               Option=3;</code>
    * @function init
    * @param {String} connString - ODBC connection string.
    */
    module.init = function() { return execMethod('db', 'init', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Executes SQL query and returns the first column of the first row in the result set.
     * @function getScalar
     * @param {String} query - The query to execute.
     * @return {Object} The first column of the first row in the result set, or a null reference 
     *                  if the result set is empty.
     */
    module.getScalar = function() { return execMethod('db', 'getScalar', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Executes SQL statement.
     * @function executeNonQuery
     * @param {String} query - The query to execute.
     */
    module.executeNonQuery = function() { return execMethod('db', 'executeNonQuery', Array.prototype.slice.call(arguments)); };
    return module;
};