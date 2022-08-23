/* eslint sort-keys: "error"*/

const SQL_ERROR_DICTIONARY = {
	ER_DUP_ENTRY: 'Duplicate entry',
	ER_NO_DEFAULT_FOR_FIELD: 'Missing field',
	INVALID_IMPLEMENTATION: 'Invalid implementation',
	INVALID_REQUEST: 'Invalid request',
	INVALID_SETUP: 'Invalid setup',
	NOT_FOUND: 'Could not find any results matching the query'
};

const SQL_ERROR_STATUSCODES = {
	ER_DUP_ENTRY: 409,
	ER_NO_DEFAULT_FOR_FIELD: 400,
	INVALID_IMPLEMENTATION: 0,
	INVALID_LIMIT: 400,
	INVALID_REFERENCE: 400,
	INVALID_REQUEST: 400,
	INVALID_START: 400,
	INVALID_VALUE: 400,
	NOT_FOUND: 404
};

class DareError extends Error {

	constructor(code, message) {

		super();
		this.code = code;
		this.status = SQL_ERROR_STATUSCODES[code] || 500;
		this.message = message || SQL_ERROR_DICTIONARY[code] || SQL_ERROR_DICTIONARY.INVALID_REQUEST;

	}

}

export default DareError;

for (const x in SQL_ERROR_STATUSCODES) {

	DareError[x] = x;

}
