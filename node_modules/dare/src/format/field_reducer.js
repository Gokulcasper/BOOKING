import checkFormat from '../utils/unwrap_field.js';
import checkLabel from '../utils/validate_label.js';
import checkKey from '../utils/validate_field.js';
import DareError from '../utils//error.js';
import fieldRelativePath from '../utils/field_relative.js';
import getFieldAttributes from '../utils/field_attributes.js';
import jsonParse from '../utils/JSONparse.js';


/**
 * Return a reducer function deriving local props and nested props
 * @param {object} opts - Options
 * @param {string} opts.field_alias_path - Current address path of the resource
 * @param {Function} opts.extract - Function for handling the extraction of content
 * @param {object} opts.table_schema - Table schema/Data model
 * @param {object} opts.dareInstance - Instance of Dare which is calling this
 * @returns {Function} Fields Reducer function
 */
export default function fieldReducer({field_alias_path, extract, table_schema, dareInstance}) {

	// Handle each field property
	return (fieldsArray, field, index, originalArray) => {

		if (typeof field !== 'string') {

			for (const key in field) {

				const value = field[key];
				if (typeof value === 'object') {

					// Ensure this isn't empty
					if (isEmpty(value)) {

						// Skip these empty objects
						continue;

					}

					// Extract nested field
					extract(key, (Array.isArray(value) ? value : [value]));

				}
				else {

					/*
					 * This field has an alias
					 * i.e. latest: MAX(created_time)
					 */

					// Check errors in the key field
					checkLabel(key);

					const formattedField = fieldMapping({field: value, label: key, table_schema, fieldsArray, field_alias_path, originalArray, dareInstance, extract});

					if (formattedField) {

						fieldsArray.push(formattedField);

					}

				}

			}

		}

		else {

			// Check errors in the key field
			field = checkKey(field);

			const formattedField = fieldMapping({field, table_schema, fieldsArray, field_alias_path, originalArray, dareInstance, extract});

			if (formattedField) {

				fieldsArray.push(formattedField);

			}

		}

		return fieldsArray;

	};

}

/**
 * FieldMapping
 * Given a label, value and schema
 * Maps the field expression to an entry in the schema and formats the entry
 * Invokes generated functions with access to modify the fieldsArray
 *
 * @param {object} opts - Object
 * @param {string} opts.field - Field expression
 * @param {string|null} opts.label - Optional label, or null
 * @param {Array} opts.fieldsArray - The current constructed array of fields
 * @param {Array} opts.originalArray - The original fields array as requested
 * @param {string} opts.field_alias_path - Current address path of the resource
 * @param {Function} opts.extract - Function for handling the extraction of content
 * @param {object} opts.table_schema - Schema of the current table
 * @param {object} opts.dareInstance - An instance of the current Dare object
 * @returns {string|object} The augemented field expression
 */
function fieldMapping({field, label, fieldsArray, originalArray, field_alias_path, extract, table_schema, dareInstance}) {

	// Extract the underlying field
	const {field_name, prefix, suffix, field_path, field: address} = checkFormat(field);

	/*
	 * Is this part of another table?
	 * Does a path exist at the end of the current_address
	 * Then we should add this to a join instead, i.e. use extract
	 */
	{

		/**
		 * Get the relative path
		 * e.g. Our current address might be grandparent.parent.
		 * Then we'd break down the new address "parent.tbl.field" => "parent.tbl." => "parent."
		 * And see that the path is actually the bit we've removed... aka tbl.field
		 */
		const path = fieldRelativePath(field_alias_path, address);
		const relative = path.split('.');

		if (relative.length > 1) {

			/*
			 * This field isnt' part of this table
			 * So lets extract this field with the table key
			 */
			const [key] = relative;
			const value = label ? {[label]: field} : field;

			// Extract nested field
			extract(key, [value]);

			return;

		}

	}

	// Try to return an object
	const isObj = Boolean(label);

	// Set the label
	if (!label) {

		// Set the label to be the field...
		label = field;

	}


	// Get the schema entry for the field
	const {handler, alias, type, readable} = getFieldAttributes(table_schema[field_name]);

	// Is this readable?
	if (readable === false) {

		throw new DareError(DareError.INVALID_REFERENCE, `Field '${field_name}' is not readable`);

	}

	// Does this field have a handler in the schema
	if (handler) {

		const requiredFields = [];

		// Generated fields
		const generated_field = handler.call(dareInstance, requiredFields);

		// Remove the required_fields which are already in the request
		const extraFields = arrayDiff(requiredFields, [...originalArray, ...fieldsArray]);

		// Add extra fields to the array
		fieldsArray.push(...extraFields);

		// Is the generated field completely abstract?
		if (typeof generated_field === 'function') {

			// Add for post processing
			dareInstance.generated_fields.unshift({
				label,
				field,
				field_alias_path,
				handler: generated_field,
				extraFields
			});

			return;

		}

		/**
		 * Otherwise the generated field has returned a string
		 * Return the string
		 */
		return {
			[label]: generated_field
		};

	}

	/*
	 * Does the field map to another field Definition
	 * An alias can map to another field name, point to a field in another model, or to a generated field
	 */
	if (alias) {

		// Rewrap the field with the alias target value
		const field = rewrap_field((field_path ? `${field_path}.` : '') + alias, prefix, suffix);

		// And rerun this function
		return fieldMapping({field, label, fieldsArray, originalArray, field_alias_path, extract, table_schema, dareInstance});

	}


	// Default format datetime field as an ISO string...
	if (type === 'datetime' && !prefix) {

		field = `DATE_FORMAT(${field},'%Y-%m-%dT%TZ')`;

	}

	// Default format datetime field as an ISO string...
	else if (type === 'json' && !prefix) {

		// Add for post processing
		dareInstance.generated_fields.push({
			label,
			field,
			field_alias_path,
			handler: item => jsonParse(item[label]) || {}
		});

		// Continue...

	}

	// If this is a object-field definition
	if (isObj || label !== field) {

		// Add the field to the array
		return {
			[label]: field
		};

	}

	else {

		// Add the field to the array
		return field;

	}

}

function rewrap_field(field_name, prefix, suffix) {

	return [prefix, field_name, suffix].filter(a => a).join('');

}

// Is Empty
function isEmpty(value) {

	return !value || (Array.isArray(value) ? value : Object.keys(value)).length === 0;

}

/**
 * Array Differ - Return all the items from A which do not exist in B
 * @param {Array} a - Array
 * @param {Array} b - Array
 * @returns {Array} Reduce array, with matches removed
 */
function arrayDiff(a, b) {

	return a.filter(item => !b.includes(item));

}
