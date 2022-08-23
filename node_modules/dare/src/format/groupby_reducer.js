
import fieldUnwrap from '../utils/unwrap_field.js';
import fieldRelativePath from '../utils/field_relative.js';
import mapReduce from '../utils/map_reduce.js';

export default function groupbyReducer({current_path, extract}) {

	return mapReduce(field => {

		// Get the field address
		const item = fieldUnwrap(field);
		const address = fieldRelativePath(current_path, item.field);

		// Get the parent of the field
		const address_split = address.split('.').filter(a => a);

		if (address_split.length <= 1) {

			// Persist the field...
			return field;

		}

		// Create a groupby in the associate model
		const key = address_split.shift();

		// Replace the field
		item.field = address_split.join('.');

		// Add to groupby
		const value = fieldWrap(item);

		// Extract
		extract(key, [value]);

		/*
		 * Dont return anything
		 * So it wont be included in the reduce list...
		 */

	});

}

function fieldWrap(item) {

	return item.prefix + item.field + item.suffix;

}
