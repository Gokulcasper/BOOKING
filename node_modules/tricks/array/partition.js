/**
 * Partition
 * Partition an array into separate arrays
 * @param {Array} a - Array to filter
 * @param {Function} partitionIndexer - Partition indexer hander, returns the index of where to put the new array.
 * @returns {Array} An array of arrays, unflattened
 */
function partition(a, partitionIndexer) {
	if (!Array.isArray(a)) {
		return [];
	}

	// Loop through the array using the partition function
	return a.reduce((partitions, item) => {
		const index = partitionIndexer(item);
		let arr = partitions[index];
		if (!arr) {
			arr = [];
			partitions[index] = arr;
		}
		arr.push(item);
		return partitions;
	}, []);
}

module.exports = partition;
