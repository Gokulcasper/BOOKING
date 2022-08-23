export default function formatDateTime(values) {

	if (typeof values === 'string') {

		if (values.indexOf('..') === -1) {

			values = `${values}..${values}`;

		}

		let i = 0;

		// Out-of-scope cache for constructing correct format - CB
		let strCache = '';

		const a = values.split('..').map((str, index) => {

			if (!str) {

				return '';

			}

			// Pad the start of each subvalue - CB
			const padded = str.split('-').map(el => el.padStart(2, '0'));
			str = padded.join('-');

			// Allow the format yyyy-mm-dd..dd by constructing the second timestamp - CB
			if (index === 1 && str.length === 2 && strCache.length && strCache.length === 10) {

				str = strCache.slice(0, 8) + str;

			}
			strCache = str;

			// Tidy up the ISO string
			// eslint-disable-next-line security/detect-unsafe-regex
			const _str = str.replace(/(?<hour>T\d+)$/, '$<hour>:00'); // Requires minutes with hours

			const date = new Date(_str);

			if (i++) {

				const [, mm, dd, hh, i, s] = str.split(/\D+/);

				if (!mm) {

					date.setFullYear(date.getFullYear() + 1);

				}
				else if (!dd) {

					date.setMonth(date.getMonth() + 1);

				}
				else if (!hh) {

					date.setDate(date.getDate() + 1);

				}
				else if (!i) {

					date.setHours(date.getHours() + 1);

				}
				else if (!s) {

					date.setMinutes(date.getMinutes() + 1);

				}

				// Wind back a second
				if (!s) {

					date.setSeconds(date.getSeconds() - 1);

				}

			}

			return date.toISOString().replace(/\.\d+Z/, '');

		});

		if (a[0] === a[1]) {

			return a[0];

		}

		return a.join('..');

	}
	return values;

}
