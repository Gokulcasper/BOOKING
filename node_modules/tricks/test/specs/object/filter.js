const filter = require('../../../object/filter.js');

describe('object/filter', () => {

	it('should remove falsy object values', () => {

		let empty;

		const data = {
			key: 'value',
			empty
		};

		const resp = filter(data);

		// Returns a new object...
		expect(resp).to.not.eql(data);

		expect(resp).to.have.property('key', 'value');
		expect(resp).to.not.have.property('empty');

	});

	it('should remove falsy object values subject to a customisable filter', () => {

		const data = {
			key: 'value',
			remove: 'value'
		};

		const resp = filter(data, (a, key) => key === 'key');

		// Returns a new object...
		expect(resp).to.not.eql(data);

		expect(resp).to.have.property('key', 'value');
		expect(resp).to.not.have.property('remove');

	});
});
