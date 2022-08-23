

import DareError from './utils/error.js';
import fieldReducer from './format/field_reducer.js';
import groupbyReducer from './format/groupby_reducer.js';
import orderbyReducer from './format/orderby_reducer.js';
import reduceConditions from './format/reducer_conditions.js';
import limitClause from './format/limit_clause.js';
import joinHandler from './format/join_handler.js';


/**
 * Format Request initiation
 *
 * @param {object} options - Options object
 * @returns {object} Formatted options
 */
export default function(options) {

	return format_request(options, this);

}

/**
 * @typedef {object} Dare
 * @param {object} options - instance options
 * @param {Function} table_alias_handler - The db table this references
 */

/**
 * Format Request
 *
 * @param {object} options - Current iteration
 * @param {Dare} dareInstance - Instance of Dare
 * @returns {object} formatted object with all the joins
 */
async function format_request(options, dareInstance) {

	if (!options) {

		throw new DareError(DareError.INVALID_REQUEST, `Invalid options '${options}'`);

	}

	// Use the alias to find the real table name
	if (!options.alias) {

		const alias = options.table;
		options.alias = alias;

	}

	/*
	 * Reject when the table is not provided
	 */
	if (!options.table) {

		throw new DareError(DareError.INVALID_REQUEST, '`table` option is undefined');

	}

	/*
	 * Get option settings
	 */
	const {models, conditional_operators_in_value} = dareInstance.options;

	/*
	 * Options name defines the model name
	 */
	options.name = dareInstance.table_alias_handler(options.table);

	/*
	 * Retrieve the model based upon the model name (alias)
	 */
	const model = models?.[options.name] || {};

	/*
	 * Set the SQL Table, If the model redefines the table name otherwise use the model Name
	 */
	options.sql_table = model.table || options.name;

	/*
	 * Call bespoke table handler
	 * This may modify the incoming options object, ammend after handler, etc...
	 */
	{

		const {method} = dareInstance.options;

		// If the model does not define the method
		const handler = (method in model
			? model[method]
			// Or use the default model
			: models?.default?.[method]
		);

		if (handler) {

			// Trigger the handler which alters the options...
			await handler.call(dareInstance, options, dareInstance);

		}

	}


	const {schema: table_schema = {}} = model;


	// Set the prefix if not already
	options.field_alias_path = options.field_alias_path || '';

	const {field_alias_path} = options;

	// Current Path
	const current_path = options.field_alias_path || `${options.alias}.`;

	// Create a shared object to provide nested objects
	const joined = {};

	/**
	 * Extract nested Handler
	 * @param {string} propName - Type of item
	 * @param {boolean} isArray - Is array, otherwise expect object
	 * @param {string} key - Key to extract
	 * @param {*} value - Value to extract
	 * @returns {void} - Nothing
	 */
	function extractJoined(propName, isArray, key, value) {

		if (!joined[key]) {

			joined[key] = {};

		}

		// Set default...
		joined[key][propName] = joined[key][propName] || (isArray ? [] : {});

		// Handle differently
		if (isArray) {

			joined[key][propName].push(...value);

		}
		else {

			joined[key][propName] = {...joined[key][propName], ...value};

		}

	}

	// Format filters
	if (options.filter) {

		// Extract nested filters handler
		const extract = extractJoined.bind(null, 'filter', false);

		// Return array of immediate props
		const arr = reduceConditions(options.filter, {extract, propName: 'filter', table_schema, conditional_operators_in_value});

		options._filter = arr.length ? arr : null;

	}

	// Format fields
	if (options.fields) {

		// Fields must be an array, or a dictionary (aka object)
		if (typeof options.fields !== 'object') {

			throw new DareError(DareError.INVALID_REFERENCE, `The field definition '${options.fields}' is invalid.`);

		}

		// Extract nested fields handler
		const extract = extractJoined.bind(null, 'fields', true);

		// Set reducer options
		const reducer = fieldReducer({field_alias_path, extract, table_schema, dareInstance});

		// Return array of immediate props
		options.fields = toArray(options.fields).reduce(reducer, []);

	}

	// Format conditional joins
	if (options.join) {

		// Extract nested joins handler
		const extract = extractJoined.bind(null, 'join', false);

		// Return array of immediate props
		options._join = reduceConditions(options.join, {extract, propName: 'join', table_schema, conditional_operators_in_value});

	}

	/*
	 * Groupby
	 * If the content is grouped
	 */
	if (options.groupby) {

		// Extract nested groupby handler
		const extract = extractJoined.bind(null, 'groupby', true);

		// Set reducer options
		const reducer = groupbyReducer({current_path, extract, table_schema});

		// Return array of immediate props
		options.groupby = toArray(options.groupby).reduce(reducer, []);


	}

	/*
	 * Orderby
	 * If the content is ordered
	 */
	if (options.orderby) {

		// Extract nested orderby handler
		const extract = extractJoined.bind(null, 'orderby', true);

		// Set reducer options
		const reducer = orderbyReducer({current_path, extract, table_schema});

		// Return array of immediate props
		options.orderby = toArray(options.orderby).reduce(reducer, []);

	}


	// Set default limit
	{

		const limits = limitClause(options, dareInstance.MAX_LIMIT);
		Object.assign(options, limits);

	}

	// Joins
	{

		const joins = options.joins || [];

		// Add additional joins which have been derived from nested fields and filters...
		for (const alias in joined) {

			// Furnish the join table a little more...
			const join_object = Object.assign(joined[alias], {
				alias,
				field_alias_path: `${options.field_alias_path}${alias}.`,
				table: dareInstance.table_alias_handler(alias)
			});


			/*
			 * Join referrencing
			 * Create the join_conditions which link two tables together
			 */
			const new_join_object = joinHandler(join_object, options, dareInstance);

			// Reject if the join handler returned a falsy value
			if (!new_join_object) {

				throw new DareError(DareError.INVALID_REFERENCE, `Could not understand field '${alias}'`);

			}

			// Mark the join object to negate
			new_join_object.negate = alias.startsWith('-');

			// Help the GET parser

			// Does this contain a nested filter, orderby or groupby?
			join_object.has_filter = new_join_object.has_filter = Boolean(join_object.filter || join_object.orderby || join_object.groupby);

			// Does this contain nested fields
			join_object.has_fields = new_join_object.has_fields = !!(Array.isArray(join_object.fields) ? join_object.fields.length : join_object.fields);

			// Update the request with this table join
			joins.push(new_join_object);

		}

		// Loop through the joins array
		if (joins.length) {

			// Loop through the joins and pass through the formatter
			const a = joins.map(join_object => {

				// Set the parent
				join_object.parent = options;

				// Format join...
				return format_request(join_object, dareInstance);

			});

			// Add Joins
			options._joins = await Promise.all(a);

		}

	}

	return options;

}


function toArray(a) {

	if (typeof a === 'string') {

		a = a.split(',').map(s => s.trim());

	}
	else if (!Array.isArray(a)) {

		a = [a];

	}
	return a;

}
