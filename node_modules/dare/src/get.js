

import DareError from './utils/error.js';
import group_concat from './utils/group_concat.js';
import field_format from './utils/field_format.js';
import orderbyUnwrap from './utils/orderby_unwrap.js';


export default async function(opts) {

	// Reset the alias
	this.unique_alias_index = 0;

	// Define the buildQuery
	this.buildQuery = buildQuery;

	/*
	 * Define the Traversal
	 * This is triggered by the build query to create the SQL
	 */
	this.traverse = traverse;

	// Execute the Build
	const {sql, values} = this.buildQuery(opts);

	// Execute the query
	const sql_response = await this.sql({sql, values});

	// Format the response
	const resp = await this.response_handler(sql_response);

	// If limit was not defined we should return the first result only.
	if (opts.single) {

		if (resp.length) {

			return resp[0];

		}
		else if (typeof opts.notfound === 'function') {

			opts.notfound();

		}

		return opts.notfound;

	}

	return resp;

}

function buildQuery(opts) {

	opts.root = true;

	// Limit
	const sql_limit = `LIMIT ${opts.start ? `${opts.start},` : ''}${opts.limit}`;

	// SubQuery
	const {is_subquery} = opts;

	// Traverse the Request Object
	const {
		fields,
		has_many_join,
		sql_subquery_values,
		sql_joins,
		sql_join_values,
		sql_filter,
		groupby,
		orderby,
		sql_values
	} = this.traverse(opts, is_subquery);

	// Get the root tableID
	const {sql_table, sql_alias} = opts;

	{

		// Count is a special field, find and replace ...
		fields.filter(item => item.expression === `${sql_alias}._count`)
			.forEach(item => {

				item.expression = 'COUNT(*)';
				item.label = '_count';
				item.agg = true;

			});

		// Find the special _group column...
		fields
			.filter(item => item.expression === `${sql_alias}._group`)
			.forEach(item => {

				// Pick the first_groupby statement
				item.expression = groupby[0].expression;
				item.label = '_group';

			});

	}

	// Conditions
	if (opts._join) {

		opts._join.forEach(([field, condition, values]) => {

			sql_values.push(...values);
			sql_filter.push(formCondition(sql_alias, field, condition));

		});

	}

	// Merge values
	const values = []
		.concat(sql_subquery_values)
		.concat(sql_join_values)
		.concat(sql_values);

	/*
	 * Groupby
	 * If the content is grouped
	 * Ensure that the parent has opts.groupby when we're joining tables
	 */
	if (!is_subquery && !groupby.length && has_many_join) {

		// Are all the fields aggregates?
		const all_aggs = fields.every(item => item.agg);

		if (!all_aggs) {

			// Determine whether there are non?
			groupby.push({expression: `${opts.sql_alias}.id`});

		}

	}

	// Format Fields
	let sql_fields;
	let alias;

	if (opts.negate && fields.length === 0) {

		sql_fields = [1];

	}

	else if (is_subquery) {

		// Generate a Group Concat statement of the result
		const address = opts.field_alias_path || opts._joins[0].field_alias_path;
		const gc = group_concat(fields, address);
		sql_fields = gc.expression;
		alias = gc.label;

	}
	else {

		sql_fields = fields.map(field => `${field.expression}${field.label ? ` AS '${field.label}'` : ''}`);

	}

	// Clean up sql_orderby
	const sql_orderby = aliasOrderAndGroupFields(orderby, fields);

	// Clean up sql_orderby
	const sql_groupby = aliasOrderAndGroupFields(groupby, fields);

	// Convert to count the resultset
	if (opts.countRows) {

		// Change the rows to show the count of the rows returned
		sql_fields = `COUNT(DISTINCT ${sql_groupby.length ? sql_groupby : `${opts.sql_alias}.id`}) AS 'count'`;

		// Remove groupby and orderby...
		sql_groupby.length = 0;
		sql_orderby.length = 0;

	}

	// Fields should be a non-empty array
	if (!sql_fields.length) {

		/*
		 * This query does not contain any fields
		 * And so we should not include it
		 */
		throw new DareError(DareError.INVALID_REQUEST, 'Missing fields');

	}

	// Put it all together
	const sql = `SELECT ${sql_fields.toString()}
				 FROM ${sql_table} ${sql_alias}
						${sql_joins.join('\n')}
				 ${sql_filter.length ? 'WHERE' : ''}
					 ${sql_filter.join(' AND ')}
				 ${sql_groupby.length ? `GROUP BY ${sql_groupby}` : ''}
				 ${sql_orderby.length ? `ORDER BY ${sql_orderby}` : ''}
				 ${sql_limit}`;

	return {sql, values, alias};

}


function traverse(item, is_subquery) {

	// Filters populate the filter and values (prepared statements)
	const sql_filter = [];
	const sql_values = [];

	// Fields
	const fields = [];

	const sql_subquery_values = [];

	/*
	 * List
	 * Store each item in a list
	 */
	const list = [];

	// Joins
	const sql_joins = [];
	const sql_join_values = [];

	// SQL GroupBy
	const groupby = [];

	// SQL GroupBy
	const orderby = [];


	const {parent} = item;

	const resp = {
		sql_filter,
		sql_values,
		groupby,
		orderby,
		fields,
		list,
		sql_subquery_values,
		sql_joins,
		sql_join_values,
		has_many_join: false
	};

	// Things to change if this isn't the root.
	if (parent) {

		if (item._join) {

			item._join = item._join.filter(([field]) => {

				// Special join condition
				if (field === '_required') {

					// Dont include this filter
					item.required_join = true;
					return false;

				}

				return true;

			});

		}

		// Is this required join table?
		if (!item.required_join && !item.has_fields && !item.has_filter) {

			// Prevent this join from being included.
			return resp;

		}

		// Adopt the parents settings
		const {many} = item;

		// Does this have a many join
		resp.has_many_join = many;

		/*
		 * We're unable to filter the subquery on a set of values
		 * So, Do any of the ancestors containing one-many relationships?
		 */
		let ancestors_many = false;

		{

			let x = item;
			while (x.parent) {

				if (x.parent.many) {

					ancestors_many = true;
					break;

				}
				x = x.parent;

			}

		}

		/*
		 * Should this be a sub query?
		 * The join is not required for filtering,
		 * And has a one to many relationship with its parent.
		 */
		if (this.group_concat && !is_subquery && !ancestors_many && !item.required_join && !item.has_filter && many && !item.groupby) {

			// Mark as subquery
			item.is_subquery = true;

			// Make the sub-query
			const sub_query = this.buildQuery(item);

			// Add the values
			sql_subquery_values.push(...sub_query.values);

			// Add the formatted field
			fields.push({
				expression: `(${sub_query.sql})`,
				label: sub_query.alias
			});

			// The rest has been handled in the sub-query
			return resp;

		}


		/**
		 * If this is a negate join...
		 * NOT EXIST (SELECT 1 FROM alias WHERE join_conditions)
		 */
		if (item.negate && !is_subquery) {

			// Mark as another subquery
			item.is_subquery = true;

			// Create sub_query
			const sub_query = this.buildQuery(item);

			// Update the filters
			sql_values.push(...sub_query.values);
			sql_filter.push(`NOT EXISTS (${sub_query.sql})`);

			return resp;

		}

	}

	const sql_alias = this.get_unique_alias();
	item.sql_alias = sql_alias;

	if (parent) {

		// Update the values with the alias of the parent
		const sql_join_condition = [];
		if (item._join) {

			item._join.forEach(([field, condition, values]) => {

				sql_join_values.push(...values);
				sql_join_condition.push(formCondition(sql_alias, field, condition));

			});

			// Prevent join condifions from being applied twice in buildQuery
			item._join.length = 0;

		}
		for (const x in item.join_conditions) {

			const val = item.join_conditions[x];
			sql_join_condition.push(`${sql_alias}.${x} = ${parent.sql_alias}.${val}`);

		}

		const {required_join} = item;

		// Required Join
		item.required_join = required_join && (parent.required_join || parent.root);

		if (!item.is_subquery) {

			/*
			 * Required JOIN is used to lock table records together
			 * This ensures that authorisation in can be handled by another
			 */

			// If the parent is not required or the root
			if (required_join && !(parent.required_join || parent.root)) {

				// Enforce a join by adding filters based on the table relationships
				for (const x in item.join_conditions) {

					const val = item.join_conditions[x];
					sql_filter.push(`(${sql_alias}.${x} = ${parent.sql_alias}.${val} OR ${parent.sql_alias}.${val} IS NULL)`);

				}

			}

			// Append to the sql_join
			sql_joins.push(`${item.required_join ? '' : 'LEFT'} JOIN ${item.sql_table} ${sql_alias} ON (${sql_join_condition.join(' AND ')})`);

		}
		else {

			// Merge the join condition on the filter
			sql_filter.push(...sql_join_condition);

			// Offload and Reset the sql_join_values
			sql_values.push(...sql_join_values);
			sql_join_values.length = 0;

		}

	}


	/*
	 * Build up the SQL conditions
	 * e.g. filter= {category: asset, action: open, created_time: 2016-04-12T13:29:23Z..]
	 */
	if (item._filter) {

		item._filter.forEach(([field, condition, values]) => {

			sql_values.push(...values);
			sql_filter.push(formCondition(sql_alias, field, condition));

		});

	}

	/*
	 * Fields
	 * e.g. fields = [action, category, count, ...]
	 */
	if (item.fields) {

		// Yes, believe it or not but some queries do have them...
		item.fields.map(prepField).forEach(([expression, label]) => {

			fields.push(field_format(expression, label, sql_alias, item.field_alias_path));

		});

	}

	// Traverse the next ones...
	if (item._joins) {

		item._joins.forEach(child => {

			child.parent = item;

			// Traverse the decendent arrays
			const child_resp = this.traverse(child, is_subquery);

			// Merge the results into this
			for (const x in resp) {

				const a = resp[x];
				const b = child_resp[x];
				if (Array.isArray(a)) {

					a.push(...b);

				}
				else if (b) {

					resp[x] = b;

				}

			}

		});

	}

	// Groupby
	if (item.groupby) {

		// Either an empty groupby
		groupby.push(...item.groupby.map(field => field_format(field, null, sql_alias, item.field_alias_path)));

	}

	// Orderby
	if (item.orderby) {

		// Either an empty groupby
		const a = item.orderby.map(entry => {

			// Split the entry into field and direction
			const {field, direction} = orderbyUnwrap(entry);

			/*
			 * Create a Field object
			 * Extend object with direction
			 * Return the object
			 */
			return Object.assign(field_format(field, null, sql_alias, item.field_alias_path), {direction});

		});

		orderby.push(...a);

	}

	/*
	 * When the item is not within a subquery
	 * And its contains a relationship of many to one
	 * Groups all the fields into GROUP_CONCAT
	 */
	if (item.many && !is_subquery && fields.length) {

		// Generate a Group Concat statement of the result
		const address = item.field_alias_path || item._joins[0].field_alias_path;
		const gc = group_concat(fields, address);

		// Reset the fields array
		fields.length = 0;
		fields.push(gc);

	}

	// Add this resource to the internal list
	list.push(item);

	return resp;

}

function prepField(field) {

	if (typeof field === 'string') {

		return [field];

	}

	let expression;
	let label;

	// Get the first entry of the object and return
	for (const _label in field) {

		expression = field[_label];
		label = _label;
		continue;

	}

	return [expression, label];

}

function formCondition(tbl_alias, field, condition) {

	const field_definition = `${tbl_alias}.${field}`;

	// Insert the field name in place
	return condition.includes('$$') ? condition.replace(/\$\$/g, field_definition) : `${field_definition} ${condition}`;

}

function aliasOrderAndGroupFields(arr, fields) {

	if (arr && arr.length) {

		return arr.map(({expression, label, direction, original}) => {

			/*
			 * _count, etc...
			 * Is the value a shortcut to a labelled field?
			 * fields.find(_field => {
			 *   if (_field.label && _field.label === expression) {
			 *     return entry;
			 *   }
			 * });
			 */

			for (const field of fields) {

				// Does the expression belong to something in the fields?
				if (field.label && (field.label === label)) {

					expression = `\`${field.label}\``;
					break;

				}
				if (field.label && field.label === original) {

					expression = `\`${field.label}\``;
					break;

				}

			}

			return [expression, direction].filter(v => !!v).join(' ');

		});

	}

	return [];

}
