/**
 * Array diff
 * Returns all items in the first array which are also in the second
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {Array} All items which are in both arrays
 */
function diff(a, b) {
	return b.filter(item => a.indexOf(item) === -1);
}

module.exports = diff;
