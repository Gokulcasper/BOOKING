const instanceOf = require('./instanceOf.js');

/**
 * Extend Object works like Object.assign(...) but recurses into the nested properties
 *
 * @param {object} base - an object to extend
 * @param {...object} args - a series of objects to extend
 * @returns {object} extended object
 */
function extend(base, ...args) {
	args.forEach(o => {
		if (Array.isArray(base) && Array.isArray(o)) {
			Array.prototype.push.apply(base, o);
		}
		else if (instanceOf(base, Object) && instanceOf(o, Object) && base !== o) {
			for (const x in o) {
				// Prevent prototype pollution
				if (x === '__proto__' || x === 'constructor') {
					continue;
				}

				base[x] = extend(base[x], o[x]);
			}
		}
		else if (Array.isArray(o)) {
			// Clone it
			base = o.slice(0);
		}
		else {
			base = o;
		}
	});
	return base;
}

module.exports = extend;
