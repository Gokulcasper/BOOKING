import getFieldAttributes from '../utils/field_attributes.js';

/**
 * Join Handler
 * Obtain the table join conditions which says how two tables reference one another
 * @param {object} join_object - The object being joined
 * @param {object} root_object - The root object, for which we want the join_object too attach
 * @param {object} dareInstance - Dare Instance
 * @returns {object} An updated join_object with new join_conditions attached
 */
export default function(join_object, root_object, dareInstance) {

	const {models, infer_intermediate_models} = dareInstance.options;

	const {table: rootModel} = root_object;
	const {table: joinModel} = join_object;

	/*
	 * The preference is to match in order:
	 * joinTable to rootTable
	 * rootTable to joinTable (inverted)
	 * Looks at the schema of both tables to find one which has a reference field to the other.
	 */

	const join_conditions = links(models[joinModel]?.schema, rootModel) || invert_links(models[rootModel]?.schema, joinModel);

	// Yes, no, Yeah!
	if (join_conditions) {

		return Object.assign(join_object, join_conditions);

	}

	/*
	 * Is the infer_intermediate_models option is set to false?
	 * --> can't guess which table to use, return null
	 */
	if (infer_intermediate_models === false) {

		return null;

	}

	// Crawl the schema for an intermediate table which is linked to both tables. link table, ... we're only going for a single Kevin Bacon. More than that and the process will deem this operation too hard.
	for (const linkTable in models) {

		// Well, ignore models of the same name
		if (linkTable === joinModel || linkTable === rootModel) {

			continue;

		}

		// LinkTable <> joinTable?
		const join_conditions = links(models[joinModel]?.schema, linkTable) || invert_links(models[linkTable]?.schema, joinModel);

		if (!join_conditions) {

			continue;

		}

		// RootTable <> linkTable
		const root_conditions = links(models[linkTable]?.schema, rootModel) || invert_links(models[rootModel]?.schema, linkTable);

		if (!root_conditions) {

			continue;

		}

		/*
		 * Awesome, this table (tbl) is the link table and can be used to join up both these tables.
		 * Also give this link table a unique Alias
		 */
		return {
			alias: dareInstance.get_unique_alias(),
			table: linkTable,
			joins: [
				Object.assign(join_object, join_conditions)
			],
			...root_conditions
		};

	}

	// Return a falsy value
	return null;

}

function links(tableSchema, joinTable, flipped = false) {

	const map = {};

	// Loop through the table fields
	for (const field in tableSchema) {

		const {references} = getFieldAttributes(tableSchema[field]);

		let ref = references || [];

		if (!Array.isArray(ref)) {

			ref = [ref];

		}

		ref.forEach(ref => {

			const a = ref.split('.');
			if (a[0] === joinTable) {

				map[field] = a[1];

			}

		});

	}

	return Object.keys(map).length ? {
		join_conditions: flipped ? invert(map) : map,
		many: !flipped
	} : null;

}

function invert_links(...args) {

	return links(...args, true);

}

function invert(o) {

	const r = {};
	for (const x in o) {

		r[o[x]] = x;

	}
	return r;

}
