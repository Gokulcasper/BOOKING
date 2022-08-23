import DareError from '../utils/error.js';

/**
 * Limit Clause
 * Set/Check limit and start positions
 * @param {object} opts - Options object
 * @param {number} opts.limit - Limit defintion
 * @param {number} opts.start - Start defintion
 * @param {number} MAX_LIMIT - Max limit on instance
 * @returns {void}
 */
export default function limitClause({limit, start}, MAX_LIMIT) {

	let single;
	if (limit === undefined) {

		limit = 1;
		single = true;

	}

	else {

		limit = +limit;

		if (isNaN(limit) || (MAX_LIMIT && limit > MAX_LIMIT) || limit < 1) {

			throw new DareError(DareError.INVALID_LIMIT, `Out of bounds limit value: '${limit}'`);

		}

	}

	if (start !== undefined) {

		start = +start;

		if (typeof start !== 'number' || isNaN(start) || start < 0) {

			throw new DareError(DareError.INVALID_START, `Out of bounds start value: '${start}'`);

		}

	}

	return {
		limit,
		...(start && {start}),
		...(single && {single})
	};

}
