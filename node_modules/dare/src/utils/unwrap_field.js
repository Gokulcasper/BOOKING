/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable prefer-named-capture-group */
import DareError from './error.js';

export default function unwrap_field(expression, formatter = (obj => obj)) {

	if (typeof expression === 'string') {

		let m;
		let str = expression;
		let suffix = '';
		let prefix = '';

		// Match a function, "STRING_DENOTES_FUNCTION(.*)"
		while ((m = str.match(/^(!?[a-z_]+\()(.*)(\))$/i))) {

			// Change the string to match the inner string...
			str = m[2];

			// Capture the suffix,prefix
			prefix += m[1];
			suffix = m[3] + suffix;

			let int_m;

			// Remove suffix tweaks
			if ((int_m = str.match(/(.*)(\s+ORDER BY 1)\s*$/))) {

				suffix = int_m[2] + suffix;
				str = int_m[1];

			}

			// Split out comma variables
			while ((int_m = str.match(/(.*)(,\s*((?<quote>["'])?[a-z0-9%._\s-]*\k<quote>))$/i))) {

				/*
				 * Is there an unquoted parameter
				 * Ensure there are no lowercase strings (e.g. column names)
				 */
				if (!int_m[4] && int_m[3] && int_m[3].match(/[a-z]/)) {

					// Is this a valid field
					throw new DareError(DareError.INVALID_REFERENCE, `The field definition '${expression}' is invalid.`);

				}

				str = int_m[1];
				suffix = int_m[2] + suffix;

			}


			/*
			 * Deal with math and operators against a value
			 */
			const int_x = str.match(/(.*)(\s(\*|\/|>|<|=|<=|>=|<>|!=)\s([0-9.]+|((?<quote>["'])[a-z0-9%._\s-]*\k<quote>)))$/i);

			if (int_x) {

				str = int_x[1];
				suffix = int_x[2] + suffix;

			}

		}

		// Does the string start with a negation (!) ?
		if (str && str.startsWith('!')) {

			prefix += '!';
			str = str.slice(1);

		}

		// Remove any additional prefix in a function.. i.e. "YEAR_MONTH FROM " from "EXTRACT(YEAR_MONTH FROM field)"
		if (prefix && str && (m = str.match(/^[A-Z_\s]+\s/))) {

			prefix += m[0];
			str = str.slice(m[0].length);

		}

		// Finally check that the str is a match
		if (str.match(/^[a-z0-9$._*]*$/i)) {

			const field = str;
			const a = str.split('.');
			const field_name = a.pop();
			const field_path = a.join('.');

			// This passes the test
			return formatter({
				field,
				field_name,
				field_path,
				prefix,
				suffix
			});

		}

	}

	// Is this a valid field
	throw new DareError(DareError.INVALID_REFERENCE, `The field definition '${expression}' is invalid.`);

}
