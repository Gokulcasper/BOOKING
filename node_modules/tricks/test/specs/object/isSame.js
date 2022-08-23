const isSame = require('../../../object/isSame.js');

describe('object/isSame', () => {

	describe('should match', () => {

		[
			'Hello',
			null,
			1,
			10000000000,
			-1,
			[],
			[1, 2, 3],
			['A', 'B', 'C'],
			{},
			{
				prop: 'value',
				nested: {
					prop: 'value'
				}
			}
		]
			.forEach(a => {

				const b = JSON.parse(JSON.stringify(a));

				it(`should match ${a}`, () => {

					const resp = isSame(a, b);

					// Returns a new object...
					expect(resp).to.be.ok();

				});
			});

	});


	describe('should not match', () => {

		[
			['Hello', 'Hallo'],
			[null, {}],
			[1, 0],
			[10000000000, 1],
			[-2, -1],
			[[], [1]],
			[
				[1, 2, 3],
				[1, 2, 4],
			],
			[
				['A', 'B', 'C'],
				['A', 'B']
			],
			[
				{},
				{a: 1}
			],
			[
				{
					prop: 'value',
					nested: {
						prop: 'value'
					}
				},
				{
					prop: 'value',
					nested: {
						prop: 'value',
						another: 'value'
					}
				}
			]
		]
			.forEach(([a, b]) => {

				it(`should match ${a}`, () => {

					const resp = isSame(a, b);

					// Returns a new object...
					expect(resp).to.not.be.ok();

				});
			});

	});
});
