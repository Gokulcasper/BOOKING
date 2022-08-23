const capitalize = require('../../../string/capitalize.js');

describe('string/capitalize', () => {

	it('should capitalize the first letter', () => {

		const input = 'capitalize';
		const expected = 'Capitalize';
		const output = capitalize(input);

		expect(output).to.eql(expected);
	});
});
