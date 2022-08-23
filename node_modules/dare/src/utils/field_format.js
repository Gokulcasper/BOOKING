import unwrap_expression from './unwrap_field.js';

export default function field_format(original, label, table_prefix, label_prefix) {

	const {field, prefix, suffix} = unwrap_expression(original);

	// Split it...
	const a = field.split('.');
	const name = a.pop();
	const address = a.join('.');


	// Prefix the label to show depth
	if (label_prefix) {

		// Does the expression contain a nested address?
		if (address) {

			// Deduct the nested address from the label_prefix
			label_prefix = label_prefix.slice(0, label_prefix.lastIndexOf(address));

		}

		label = `${label_prefix}${label || name}`;

	}

	label = label || undefined;

	// Expression
	const expression = `${prefix || ''}${table_prefix}.${name}${suffix || ''}`;

	// Aggregate function flag
	let agg = false;

	if (prefix && /\b(?:SUM|COUNT|AVG|MAX|MIN|GROUP_CONCAT)\(/.test(prefix.toUpperCase())) {

		agg = true;

	}

	return {
		original,
		expression,
		label,
		agg
	};

}
