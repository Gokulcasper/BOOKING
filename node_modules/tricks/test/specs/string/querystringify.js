const querystringify = require('../../../string/querystringify.js');

describe('string/querystringify', () => {

	const test = {
		param: 'param1',
		param2: 'param2',
		hyperlink: 'https://example.com?a=1&b=2',
		jsonp: '?'
	};

	it('should accept an object and return a string', () => {

		const value = querystringify({});

		expect(value).to.be.a('string');

	});

	it('should turn an object into a URL string', () => {

		// Convert there and back

		const value = querystringify(test);

		expect(value).to.be.a('string');

	});

	it('should only include hasOwnProperties from an object', () => {

		// Convert there and back

		const obj = Object.create({ignore: 'this should be excluded'});
		obj.included = 'this is included';

		const value = querystringify(obj);

		expect(value).to.contain('included').and.not.to.contain('ignore');

	});

});
