const tryCatch = require('../object/tryCatch.js');
/**
 * JSONParse
 * Wraps JSON.parse in a try/catch
 * @param {string} str - String to parse
 * @returns {object} JSON Object
 *
 * @example <caption>JSONParse</caption>
 * JSONParse(null)
 * // undefined
 */
function JSONParse(str) {
	return tryCatch(() => JSON.parse(str));
}

module.exports = JSONParse;
