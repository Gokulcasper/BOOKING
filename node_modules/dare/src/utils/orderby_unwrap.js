export default str => {

	let direction = '';
	const field = str.replace(/\s*(?:DESC|ASC)$/i, m => {

		direction = m.toUpperCase();
		return '';

	});

	return {
		field,
		direction
	};

};
