/**
 * Provides methods for working with Data Bases through ODBC.
 */
module.exports = function(execMethod) {
    var module = {};
    /**
    * Stores DB connection string to be used by other methods. This method doesn't actually open the
    * connection as it's opened/closed automatically by query methods.
    * @function init
    * @param {String} connString - ODBC connection string.<br/>
    *                              Example:<br/>
    *                              "Driver={MySQL ODBC 5.3 UNICODE Driver};" +<br/>
    *                              "Server=localhost;Database=myDatabase;" +<br/>
    *                              "User=myUsername;Password=myPassword;Option=3;"
    */
    module.init = function() { return execMethod('db', 'init', Array.prototype.slice.call(arguments)); };
    /**
     * Executes the query, and returns the first column of the first row in the result set returned 
     * by the query. Additional columns or rows are ignored.
     * @function getScalar
     * @param {String} query - Query to execute.
     * @return {Object} The first column of the first row in the result set,  or a null reference 
     *                  if the result set is empty.
     */
    module.getScalar = function() { return execMethod('db', 'getScalar', Array.prototype.slice.call(arguments)); };
    /**
     * Executes an SQL statement.
     * @function executeNonQuery
     * @param {String} query - Query to execute.
     */
    module.executeNonQuery = function() { return execMethod('db', 'executeNonQuery', Array.prototype.slice.call(arguments)); };
    return module;
};