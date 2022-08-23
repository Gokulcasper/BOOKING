/**
 * Given a field definition defined in the schema, extract it's attributes
 *
 * @param {object|Function|string|undefined} fieldDefinition - A field definition as described in the schema
 * @returns {object} An object containing the attributes of the field
 */

export default fieldDefinition => {

	if (fieldDefinition && typeof fieldDefinition === 'object' && !Array.isArray(fieldDefinition)) {

		// This is already a definition object
		return fieldDefinition;

	}

	if (typeof fieldDefinition === 'string') {

		// This is an alias reference, the name is an alias of another
		return {
			alias: fieldDefinition
		};

	}

	if (Array.isArray(fieldDefinition)) {

		// This is an reference to another table, this field can be used in a table join
		return {
			references: fieldDefinition
		};

	}

	if (typeof fieldDefinition === 'function') {

		// This is a generated field
		return {
			handler: fieldDefinition
		};

	}

	if (fieldDefinition === false) {

		// Mark as inaccessible
		return {
			readable: false,
			writeable: false
		};

	}

	return {};

};
