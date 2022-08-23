// Prevent a bad format from killing the service, instead return undefined
export default value => {

	try {

		// Ensure Buffers are converted..
		if (Buffer.isBuffer(value)) {

			value = value.toString();

		}

		return JSON.parse(value
			.replace(/\t/g, '\\t')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			.replace(/\f/g, '\\f')
		);

	}
	catch {
		// Continue
	}

};
