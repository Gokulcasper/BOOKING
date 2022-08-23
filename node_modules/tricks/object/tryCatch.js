module.exports = fn => {
	try {
		return fn();
	}
	catch {
		// Continue
	}
};
