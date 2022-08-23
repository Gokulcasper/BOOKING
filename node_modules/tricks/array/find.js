/**
 * Array find
 * Returns the first non undefined response
 * If the response is (Boolean) True, then the value of that array item is returned instead...
 *
 * @param {Array} arr - Array or iterable object to search
 * @param {Function} callback - callback to run tests on, return value other than undefined to stop searching
 * @param {object} thisArg - Instance to execute the callback on
 * @returns {*} returns the found item in the array if the callback returned true, or the response from the callback.
 */
function find(arr, callback, thisArg = null) {
	for (let i = 0; i < arr.length; i++) {
		const value = callback.call(thisArg, arr[i]);
		if (value !== undefined) {
			return value === true ? arr[i] : value;
		}
	}
}

module.exports = find;
