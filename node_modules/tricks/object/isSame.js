/**
 * isSame compares two parameters to determine whether they have identical structures and values.
 *
 * @param {*} a - first parameter
 * @param {*} b - second parameter
 * @returns {boolean} true if the two parameters have the same value
 *
 * @example <caption>matches nested objects with same keys => values</caption>
 * // returns true
 * isSame({a: {b: 1}}, {a: {b: 1}});
 *
 * @example <caption>does not match nested objects with same keys, but different values</caption>
 * // returns false
 * isSame({a: {b: 1}}, {a: {b: 2}});
 *
 * @example <caption>does not match nested objects with additional properties</caption>
 * // returns false
 * isSame({a: {b: 1}}, {a: {b: 1, c: 2}});
 */
function isSame(a, b) {
	const type = typeof a;
	if (type !== typeof b) {
		return false;
	}
	else if (type === 'object' && a !== null && b !== null) {

		const _a = Array.isArray(a);
		const _b = Array.isArray(b);

		// Are they the same type?
		if (_a !== _b) {
			return false;
		}

		// Given Array's
		else if (_a) {
			// Compare the lengths
			if (a.length !== b.length) {
				return false;
			}
		}

		// Else, for Objects
		else if (Object.keys(a).length !== Object.keys(b).length) {
			return false;
		}


		// Compare each property
		for (const x in a) {
			if (!isSame(a[x], b[x])) {
				return false;
			}
		}
	}
	else if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {

		return true;
	}
	else if (a !== b) {
		return false;
	}

	return true;
}

module.exports = isSame;
