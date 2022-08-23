/**
 * Determines if the value is empty, accepts object and primitive types
 *
 * @param {*} obj - value
 * @returns {boolean} Returns true is the object is falsy, or an empty object/array.
 *
 * @example <caption>Returns true for empty objects</caption>
 * isEmpty(null)
 * isEmpty([])
 * isEmpty(0)
 * isEmpty({})
 * isEmpty('')
 */
function isEmpty(obj) {

	// Scalar
	if (!obj)
		return true;

	// Array
	if (Array.isArray(obj)) {
		return !obj.length;
	}
	else if (typeof (obj) === 'object') {
		// Object
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				return false;
			}
		}
	}

	return true;
}

module.exports = isEmpty;

