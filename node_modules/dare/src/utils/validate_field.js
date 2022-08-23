import DareError from './error.js';
import validate_alias from './validate_alias.js';

export default function validate_field(key) {

	const a = key.split('.');

	const field = a
		.pop()
		// Remove any alias suffix from the key
		.replace(/\$.*$/, '');

	const reg = /^[a-z_]+$/i;

	// Capture errors in the key
	if (!field.match(reg)) {

		throw new DareError(DareError.INVALID_REFERENCE, `The key '${key}' must match ${reg}`);

	}

	// Validate the path

	if (a.length) {

		const path = a.join('.');

		validate_alias(path);

	}

	return [...a, field].join('.');

}
