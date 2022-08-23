const partition = require('../../../array/partition.js');

describe('array/partition', () => {

	it('should return only partition and array based upon a handler which returns the index', () => {

		// Split values into odd and even
		const [even, odd] = partition([1, 3, 1, 2, 3], item => item % 2);
		expect(odd).to.eql([1, 3, 1, 3]);
		expect(even).to.eql([2]);
	});

});
