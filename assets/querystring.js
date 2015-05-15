/**
 * Handling anything to do with URL query strings.
 * @namespace
 */
var querystring = {};

/**
 * @static
 * @param {Object} obj
 * @returns {string}
 */
querystring.fromDict = function (obj) {
    var key;
    var keyValuePairs = [];
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            keyValuePairs.push(key + '=' + obj[key]);
        }
    }
    return encodeURIComponent(keyValuePairs.join('&'));
};

/**
 * @static
 * @param {string} querystring
 * @returns {Object}
 */
querystring.toDict = function (querystring) {
    var strings = decodeURIComponent(querystring).split('&');

    if (strings[0]) {
        var obj = {};

        strings.forEach(function (v) {
            var query = v.split('=');
            var key = query[0];
            obj[key] = query[1] || '';
        });

        return obj;

    } else {
        return undefined;
    }
};