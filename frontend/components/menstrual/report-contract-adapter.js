function toDateOnly(value) {
	return new Date(`${value}T00:00:00.000Z`);
}

function diffDays(startDate, endDate) {
	return Math.round((toDateOnly(endDate) - toDateOnly(startDate)) / 86400000);
}

function formatAverageText(value) {
	return `${value.toFixed(1)} 天`;
}

function formatCurrentSettingValue(value) {
	return Number.isFinite(value) ? `${value} 天` : '-';
}

function getFiniteNumberOrNull(value) {
	return Number.isFinite(value) ? value : null;
}

function getRoundedAverageOrNull(values) {
	if (!values.length) {
		return null;
	}

	const average = values.reduce((sum, value) => sum + value, 0) / values.length;
	return Math.round(average);
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
	return `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatHistoryYear(dateString) {
	return String(toDateOnly(dateString).getUTCFullYear());
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
		}))
		.slice(-7);

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
			yearLabel: formatHistoryYear(record.startDate),
			startLabel: formatHistoryDate(record.startDate),
			endLabel: formatHistoryDate(record.endDate),
			durationLabel: `${record.durationDays}d`,
			cycleLabel: Number.isFinite(record.cycleLength) ? `${record.cycleLength}d` : '-'
		}));
}

function createSummaryFooterAlign({ moduleSettings = null, records = [] } = {}) {
	const durationValues = records
		.map((record) => record.durationDays)
		.filter((value) => Number.isFinite(value));
	const cycleValues = records
		.map((record) => record.cycleLength)
		.filter((value) => Number.isFinite(value));

	const nextDurationDays = getRoundedAverageOrNull(durationValues);
	const nextPredictionTermDays = getRoundedAverageOrNull(cycleValues);
	const canAlignDuration = Number.isFinite(nextDurationDays);
	const canAlignPrediction = Number.isFinite(nextPredictionTermDays);

	const align = {
		scenario: 'empty',
		currentDurationDays: getFiniteNumberOrNull(moduleSettings?.defaultPeriodDurationDays),
		currentPredictionTermDays: getFiniteNumberOrNull(moduleSettings?.defaultPredictionTermDays),
		nextDurationDays,
		nextPredictionTermDays,
		canAlignDuration,
		canAlignPrediction
	};

	if (align.canAlignDuration && align.canAlignPrediction) {
		align.scenario = 'full';
		return align;
	}

	if (align.canAlignDuration) {
		align.scenario = 'duration-only';
		align.nextPredictionTermDays = null;
		align.canAlignPrediction = false;
		return align;
	}

	align.nextPredictionTermDays = null;
	align.canAlignPrediction = false;
	return align;
}

function createCurrentSettingsText(align) {
	return `当前设置：周期 ${formatCurrentSettingValue(align?.currentPredictionTermDays)} · 时长 ${formatCurrentSettingValue(align?.currentDurationDays)}`;
}

function createSummaryFooter({
	moduleInstanceId = null,
	moduleSettings = null,
	accessState = null,
	records = []
} = {}) {
	const align = createSummaryFooterAlign({
		moduleSettings,
		records
	});

	return {
		currentSettingsText: createCurrentSettingsText(align),
		portalMode: accessState?.callerRole === 'viewer' ? 'readonly-warning' : 'link',
		targetModuleInstanceId: moduleInstanceId,
		align
	};
}

export function createReportPageViewModel({
	moduleInstanceId = null,
	moduleSettings = null,
	accessState = null,
	records = []
} = {}) {
	const normalizedRecords = normalizeRecords(records);
	const cycleTrend = createTrendSeries(normalizedRecords, 'cycleLength');
	const durationTrend = createTrendSeries(normalizedRecords, 'durationDays');

	return {
		summary: {
			rows: createSummaryRows(normalizedRecords),
			footer: createSummaryFooter({
				moduleInstanceId,
				moduleSettings,
				accessState,
				records: normalizedRecords
			})
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
