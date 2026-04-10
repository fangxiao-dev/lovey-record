function toDateOnly(value) {
	return new Date(`${value}T00:00:00.000Z`);
}

function diffDays(startDate, endDate) {
	return Math.round((toDateOnly(endDate) - toDateOnly(startDate)) / 86400000);
}

function formatAverageText(value) {
	return `${value.toFixed(1)} 天`;
}

function formatFluctuationText(values) {
	if (!values.length) {
		return '波动 -';
	}

	const average = values.reduce((sum, value) => sum + value, 0) / values.length;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const lower = Math.floor(Math.max(0, average - min));
	const upper = Math.floor(Math.max(0, max - average));

	return `波动 -${lower} ~ +${upper} 天`;
}

function formatMonthDay(dateString) {
	const date = toDateOnly(dateString);
	return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatHistoryDate(dateString) {
	const date = toDateOnly(dateString);
	const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
	return `${month} ${String(date.getUTCDate()).padStart(2, '0')}`;
}

function normalizeRecords(records) {
	const sorted = [...(records || [])].sort((left, right) => left.startDate.localeCompare(right.startDate));

	return sorted.map((record, index) => {
		const previous = sorted[index - 1];
		return {
			startDate: record.startDate,
			endDate: record.endDate,
			durationDays: record.durationDays,
			cycleLength: previous ? diffDays(previous.startDate, record.startDate) : null
		};
	});
}

function createSummaryRows(records) {
	const cycleValues = records.map((record) => record.cycleLength).filter((value) => Number.isFinite(value));
	const durationValues = records.map((record) => record.durationDays).filter((value) => Number.isFinite(value));

	return [
		{
			key: 'cycle',
			label: '周期',
			averageText: cycleValues.length
				? formatAverageText(cycleValues.reduce((sum, value) => sum + value, 0) / cycleValues.length)
				: '-',
			fluctuationText: formatFluctuationText(cycleValues)
		},
		{
			key: 'duration',
			label: '时长',
			averageText: durationValues.length
				? formatAverageText(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
				: '-',
			fluctuationText: formatFluctuationText(durationValues)
		}
	].map((row) => ({
		...row,
		displayText: `${row.label} ${row.averageText}   ${row.fluctuationText}`
	}));
}

function createTrendSeries(records, metricKey) {
	const points = records
		.filter((record) => Number.isFinite(record[metricKey]))
		.map((record) => ({
			key: record.startDate,
			date: record.startDate,
			value: record[metricKey],
			label: formatMonthDay(record.startDate)
		}));

	return {
		points,
		hasMinimumPoints: points.length >= 3
	};
}

function createHistoryRows(records) {
	return [...records]
		.sort((left, right) => right.startDate.localeCompare(left.startDate))
		.map((record) => ({
			key: record.startDate,
			startLabel: formatHistoryDate(record.startDate),
			endLabel: formatHistoryDate(record.endDate),
			durationLabel: `${record.durationDays}d`,
			cycleLabel: Number.isFinite(record.cycleLength) ? `${record.cycleLength}d` : '-'
		}));
}

export function createReportPageViewModel({ records = [] } = {}) {
	const normalizedRecords = normalizeRecords(records);
	const cycleTrend = createTrendSeries(normalizedRecords, 'cycleLength');
	const durationTrend = createTrendSeries(normalizedRecords, 'durationDays');

	return {
		summary: {
			rows: createSummaryRows(normalizedRecords)
		},
		trend: {
			cycle: cycleTrend,
			duration: durationTrend,
			emptyStateCopy: '记录 3 次后开始有图'
		},
		history: {
			rows: createHistoryRows(normalizedRecords)
		}
	};
}
