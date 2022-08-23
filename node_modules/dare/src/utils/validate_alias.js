import DareError from './error.js';

export default function validate_alias(key) {

	const [name, label] = key.split('$');

	// Capture errors in the key
	if (!name.match(/^[a-z_]+$/i) || (label && !label.match(/^[a-z0-9_]+$/i))) {

		throw new DareError(DareError.INVALID_REFERENCE, `The table reference '${key}' must match [a-z_]+($[a-z0-9_]+)`);

	}

}
