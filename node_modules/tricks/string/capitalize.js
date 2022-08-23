/**
 * Capitalize
 * Converts the first character of a sting to uppercase
 * @param {string} str - String to capitalize
 * @returns {string} String with the first character made uppercase
 */
function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = capitalize;
