// Validate POST body

import DareError from './error.js';

export default function validate_body(body) {

	if (!body || typeof body !== 'object' || Object.keys(body).length === 0 || (Array.isArray(body) && body.length === 0)) {

		throw new DareError(DareError.INVALID_REQUEST, `The body ${body ? JSON.stringify(body) : body} is invalid`);

	}

}
