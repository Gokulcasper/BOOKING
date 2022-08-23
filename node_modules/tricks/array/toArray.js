/**
 * Converts an iterable value to an Array
 * @param {object} obj - Object to convert into an array
 * @returns {Array} The object as an array
 */
function toArray(obj) {
	return Array.prototype.slice.call(obj);
}

module.exports = toArray;
