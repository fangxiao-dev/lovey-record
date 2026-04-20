import { createCalendarLegendItems } from './calendar-legend-data.js';
import { resolveHint } from './phase-hint-rotation.js';

const WEEKDAY_LABELS = Object.freeze(['M', 'T', 'W', 'T', 'F', 'S', 'S']);

const FLOW_OPTIONS = Object.freeze([
	{ key: 'flow-spotting', label: '极少', tone: 'flow-spotting' },
	{ key: 'flow-light', label: '少', tone: 'flow-light' },
	{ key: 'flow-normal', label: '正常', tone: 'flow-normal' },
	{ key: 'flow-heavy', label: '多', tone: 'flow-heavy' },
	{ key: 'flow-very-heavy', label: '极多', tone: 'flow-very-heavy' }
]);

const PAIN_OPTIONS = Object.freeze([
	{ key: 'pain-none', label: '无', tone: 'pain-none' },
	{ key: 'pain-light', label: '轻', tone: 'pain-light' },
	{ key: 'pain-normal', label: '正常', tone: 'pain-normal' },
	{ key: 'pain-strong', label: '强', tone: 'pain-strong' },
	{ key: 'pain-very-strong', label: '极强', tone: 'pain-very-strong' }
]);

const COLOR_OPTIONS = Object.freeze([
	{ key: 'color-very-light', label: '极浅', tone: 'color-very-light' },
	{ key: 'color-light', label: '浅', tone: 'color-light' },
	{ key: 'color-normal', label: '正常', tone: 'color-normal' },
	{ key: 'color-deep', label: '深', tone: 'color-deep' },
	{ key: 'color-very-deep', label: '极深', tone: 'color-very-deep' }
]);

const ROW_ITEM_META = Object.freeze({
	flow: { label: '流量', icon: 'water_drop' },
	pain: { label: '疼痛', icon: 'favorite' },
	color: { label: '颜色', icon: 'palette' }
});

function toDateOnly(value) {
	return new Date(`${value}T00:00:00.000Z`);
}

function formatYMD(date) {
	return date.toISOString().slice(0, 10);
}

function formatMonthDay(dateString) {
	const date = toDateOnly(dateString);
	return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatMonthDayDot(dateString) {
	const date = toDateOnly(dateString);
	return `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatMonthDayRange(startDate, endDate) {
	return `${formatMonthDayDot(startDate)} - ${formatMonthDayDot(endDate)}`;
}

function formatHumanDate(dateString) {
	const date = toDateOnly(dateString);
	return `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

function formatMonthLabel(dateString) {
	const date = toDateOnly(dateString);
	return `${String(date.getUTCFullYear()).slice(2)}年 ${date.getUTCMonth() + 1}月`;
}

function formatWindowMonthLabel(windowStartDate, windowEndDate) {
	const start = toDateOnly(windowStartDate);
	const end = toDateOnly(windowEndDate);
	const startYear = start.getUTCFullYear();
	const endYear = end.getUTCFullYear();
	const startMonth = start.getUTCMonth() + 1;
	const endMonth = end.getUTCMonth() + 1;

	if (startYear === endYear && startMonth === endMonth) {
		return `${String(startYear).slice(2)}年 ${startMonth}月`;
	}

	if (startYear === endYear) {
		return `${String(startYear).slice(2)}年 ${startMonth}月~${endMonth}月`;
	}

	return `${String(startYear).slice(2)}年 ${startMonth}月~${String(endYear).slice(2)}年 ${endMonth}月`;
}

function formatWindowMonthHeader(windowStartDate, windowEndDate) {
	const start = toDateOnly(windowStartDate);
	const end = toDateOnly(windowEndDate);
	const startYear = start.getUTCFullYear();
	const endYear = end.getUTCFullYear();
	const startMonth = start.getUTCMonth() + 1;
	const endMonth = end.getUTCMonth() + 1;

	if (startYear === endYear && startMonth === endMonth) {
		return {
			monthLabel: `${startMonth}月`,
			startYearLabel: '',
			endYearLabel: ''
		};
	}

	return {
		monthLabel: `${startMonth}月~${endMonth}月`,
		startYearLabel: startYear === endYear ? '' : String(startYear),
		endYearLabel: startYear === endYear ? '' : String(endYear)
	};
}

function createDateRange(startDate, endDate) {
	const dates = [];
	const current = toDateOnly(startDate);
	const end = toDateOnly(endDate);

	while (current <= end) {
		dates.push(formatYMD(current));
		current.setUTCDate(current.getUTCDate() + 1);
	}

	return dates;
}

function startOfWeek(dateString) {
	const date = toDateOnly(dateString);
	const day = date.getUTCDay();
	const offset = day === 0 ? -6 : 1 - day;
	date.setUTCDate(date.getUTCDate() + offset);
	return formatYMD(date);
}

function addDays(dateString, amount) {
	const date = toDateOnly(dateString);
	date.setUTCDate(date.getUTCDate() + amount);
	return formatYMD(date);
}

function getRealPeriodStartDates(homeView, extraMarks = []) {
	const starts = new Set();
	const currentStatusSummary = homeView?.currentStatusSummary || {};
	const currentSegment = currentStatusSummary.currentSegment || currentStatusSummary.currentCycle || null;
	const previousSegment = currentStatusSummary.previousSegment || null;

	(homeView?.historicalPeriodStarts || []).forEach((startDate) => {
		if (startDate) {
			starts.add(startDate);
		}
	});

	if (previousSegment?.startDate) {
		starts.add(previousSegment.startDate);
	}
	if (currentSegment?.startDate) {
		starts.add(currentSegment.startDate);
	}

	[...(homeView?.calendarMarks || []), ...extraMarks].forEach((mark) => {
		if (mark?.kind === 'period_start' && mark?.date) {
			starts.add(mark.date);
		}
	});

	return Array.from(starts).sort();
}

function segmentContainsDate(segment, date) {
	return Boolean(segment?.startDate && segment?.endDate && date >= segment.startDate && date <= segment.endDate);
}

function resolveFocusedNavigation(homeView, focusDate, calendarWindowMarks = []) {
	const realStarts = getRealPeriodStartDates(homeView, calendarWindowMarks);
	const predictionStart = homeView?.predictionSummary?.predictedStartDate || null;
	const currentStatusSummary = homeView?.currentStatusSummary || {};
	const currentSegment = currentStatusSummary.currentSegment || currentStatusSummary.currentCycle || null;
	const previousSegment = currentStatusSummary.previousSegment || null;

	if (predictionStart && focusDate === predictionStart) {
		const previousPeriodStart = realStarts.filter((startDate) => startDate < predictionStart).at(-1) || null;
		return {
			focusedAnchorDate: predictionStart,
			focusedNodeType: 'prediction',
			previousPeriodStart,
			nextPeriodStart: null,
			isForwardBoundary: true,
			isBackwardBoundary: !previousPeriodStart
		};
	}

	let focusedAnchorDate = realStarts.includes(focusDate) ? focusDate : null;
	if (!focusedAnchorDate && segmentContainsDate(currentSegment, focusDate)) {
		focusedAnchorDate = currentSegment.startDate;
	}
	if (!focusedAnchorDate && segmentContainsDate(previousSegment, focusDate)) {
		focusedAnchorDate = previousSegment.startDate;
	}
	if (!focusedAnchorDate && realStarts.length) {
		focusedAnchorDate = realStarts.filter((startDate) => startDate <= focusDate).at(-1) || realStarts[0];
	}

	if (!focusedAnchorDate) {
		return {
			focusedAnchorDate: focusDate,
			focusedNodeType: predictionStart ? 'prediction' : 'real-period',
			previousPeriodStart: null,
			nextPeriodStart: predictionStart && predictionStart > focusDate ? predictionStart : null,
			isForwardBoundary: Boolean(predictionStart && focusDate === predictionStart),
			isBackwardBoundary: true
		};
	}

	const focusedIndex = realStarts.indexOf(focusedAnchorDate);
	const previousPeriodStart = focusedIndex > 0 ? realStarts[focusedIndex - 1] : null;
	const nextRealPeriodStart = focusedIndex >= 0 ? realStarts[focusedIndex + 1] || null : null;
	const nextPeriodStart = nextRealPeriodStart || (predictionStart && predictionStart > focusedAnchorDate ? predictionStart : null);

	return {
		focusedAnchorDate,
		focusedNodeType: 'real-period',
		previousPeriodStart,
		nextPeriodStart,
		isForwardBoundary: false,
		isBackwardBoundary: !previousPeriodStart
	};
}

function resolveRealPeriodEndDate(homeView, moduleSettings, startDate) {
	const currentStatusSummary = homeView?.currentStatusSummary || {};
	const currentSegment = currentStatusSummary.currentSegment || currentStatusSummary.currentCycle || null;
	const previousSegment = currentStatusSummary.previousSegment || null;

	if (currentSegment?.startDate === startDate && currentSegment?.endDate) {
		return currentSegment.endDate;
	}
	if (previousSegment?.startDate === startDate && previousSegment?.endDate) {
		return previousSegment.endDate;
	}

	const periodDates = new Set(
		(homeView?.calendarMarks || [])
			.filter((mark) => mark?.date && (mark.kind === 'period_start' || mark.kind === 'period'))
			.map((mark) => mark.date)
	);
	if (periodDates.has(startDate)) {
		let endDate = startDate;
		let cursor = addDays(startDate, 1);
		while (periodDates.has(cursor)) {
			endDate = cursor;
			cursor = addDays(cursor, 1);
		}
		return endDate;
	}

	const durationDays = resolvePeriodDurationDays(moduleSettings);
	return durationDays ? addDays(startDate, durationDays - 1) : startDate;
}

function resolveVisibleRangeForFocusedNode(homeView, moduleSettings, focusedNavigation) {
	if (!focusedNavigation?.focusedAnchorDate) return null;

	if (focusedNavigation.focusedNodeType === 'prediction') {
		const endDate = resolvePredictedSegmentEndDate(homeView?.predictionSummary, moduleSettings);
		return endDate
			? { startDate: focusedNavigation.focusedAnchorDate, endDate }
			: null;
	}

	return {
		startDate: focusedNavigation.focusedAnchorDate,
		endDate: resolveRealPeriodEndDate(homeView, moduleSettings, focusedNavigation.focusedAnchorDate)
	};
}

function countRangeDaysInRowThree(range, windowStartDate) {
	if (!range?.startDate || !range?.endDate) return 0;
	const rowThreeStart = addDays(windowStartDate, 14);
	if (range.endDate < rowThreeStart) return 0;
	const overlapStart = range.startDate > rowThreeStart ? range.startDate : rowThreeStart;
	return diffDays(overlapStart, range.endDate) + 1;
}

function resolveThreeWeekWindowStart({ focusDate, focusedNavigation, visibleRange }) {
	const defaultWindowStart = addDays(startOfWeek(focusDate), -7);
	if (!visibleRange?.startDate || visibleRange.startDate !== focusDate) {
		return defaultWindowStart;
	}

	const firstRowWindowStart = startOfWeek(focusDate);
	const defaultRowThreeDays = countRangeDaysInRowThree(visibleRange, defaultWindowStart);
	const firstRowThreeDays = countRangeDaysInRowThree(visibleRange, firstRowWindowStart);
	const hasClearImprovement = defaultRowThreeDays >= 2 && firstRowThreeDays < defaultRowThreeDays;

	return hasClearImprovement ? firstRowWindowStart : defaultWindowStart;
}

function resolvePredictedSegmentEndDate(predictionSummary, moduleSettings) {
	const predictedStartDate = predictionSummary?.predictedStartDate;
	const durationDays = moduleSettings?.defaultPeriodDurationDays;
	if (!predictedStartDate || !Number.isInteger(durationDays) || durationDays <= 0) {
		return null;
	}
	return addDays(predictedStartDate, durationDays - 1);
}

function createPredictionDateSet(predictionSummary, moduleSettings, marks = []) {
	const predictedStartDate = predictionSummary?.predictedStartDate;
	const predictedSegmentEndDate = resolvePredictedSegmentEndDate(predictionSummary, moduleSettings);
	if (predictedStartDate && predictedSegmentEndDate) {
		return new Set(createDateRange(predictedStartDate, predictedSegmentEndDate));
	}

	return new Set(
		(marks || [])
			.filter((mark) => mark.kind === 'prediction_start')
			.map((mark) => mark.date)
	);
}

function startOfMonth(dateString) {
	const date = toDateOnly(dateString);
	date.setUTCDate(1);
	return formatYMD(date);
}

function endOfMonth(dateString) {
	const date = toDateOnly(dateString);
	date.setUTCMonth(date.getUTCMonth() + 1, 0);
	return formatYMD(date);
}

function diffDays(startDate, endDate) {
	const start = toDateOnly(startDate);
	const end = toDateOnly(endDate);
	return Math.round((end - start) / 86400000);
}

function deriveSingleDayPeriodChip({ homeView, dayRecord }) {
	if (!dayRecord?.isPeriod || !dayRecord?.date) {
		return {
			text: '月经',
			selected: false
		};
	}

	const periodDates = new Set(
		(homeView?.calendarMarks || [])
			.filter((mark) => mark.kind === 'period' || mark.kind === 'period_start')
			.map((mark) => mark.date)
	);
	periodDates.add(dayRecord.date);

	const previousDate = addDays(dayRecord.date, -1);
	const nextDate = addDays(dayRecord.date, 1);
	const hasPreviousPeriod = periodDates.has(previousDate);
	const hasNextPeriod = periodDates.has(nextDate);

	return {
		text: hasPreviousPeriod ? '月经结束' : '月经开始',
		selected: true,
		role: !hasPreviousPeriod && !hasNextPeriod
			? 'start'
			: !hasPreviousPeriod
				? 'start'
				: !hasNextPeriod
					? 'end'
					: 'in-progress'
	};
}

export function createOptionRows(dayRecord) {
	const selectedLevels = {
		flow: dayRecord?.flowLevel ?? null,
		pain: dayRecord?.painLevel ?? null,
		color: dayRecord?.colorLevel ?? null
	};

	return [
		{
			key: 'flow',
			label: '流量',
			icon: 'water_drop',
			options: FLOW_OPTIONS.map((option, index) => ({
				...option,
				selected: selectedLevels.flow === index + 1
			}))
		},
		{
			key: 'pain',
			label: '疼痛',
			icon: 'favorite',
			options: PAIN_OPTIONS.map((option, index) => ({
				...option,
				selected: selectedLevels.pain === index + 1
			}))
		},
		{
			key: 'color',
			label: '颜色',
			icon: 'palette',
			options: COLOR_OPTIONS.map((option, index) => ({
				...option,
				selected: selectedLevels.color === index + 1
			}))
		}
	];
}

export function createSummaryItems(dayRecord) {
	if (!dayRecord) return [];

	const items = [];

	if (dayRecord.flowLevel !== null) {
		const option = FLOW_OPTIONS[dayRecord.flowLevel - 1];
		items.push({ key: 'flow', label: '流量', icon: 'water_drop', tone: option.tone, value: option.label });
	}
	if (dayRecord.painLevel !== null) {
		const option = PAIN_OPTIONS[dayRecord.painLevel - 1];
		items.push({ key: 'pain', label: '疼痛', icon: 'favorite', tone: option.tone, value: option.label });
	}
	if (dayRecord.colorLevel !== null) {
		const option = COLOR_OPTIONS[dayRecord.colorLevel - 1];
		items.push({ key: 'color', label: '颜色', icon: 'palette', tone: option.tone, value: option.label });
	}

	return items;
}

function mapStatusLabel(sharingStatus) {
	return sharingStatus === 'shared' ? '共享' : '私人';
}

function getCurrentSegment(homeView) {
	return homeView.currentStatusSummary?.currentSegment || homeView.currentStatusSummary?.currentCycle || null;
}

function getFocusDate(homeView, dayDetail, today) {
	return dayDetail?.dayRecord?.date
		|| homeView.selectedDay?.date
		|| homeView.currentStatusSummary?.anchorDate
		|| homeView.predictionSummary?.predictedStartDate
		|| today;
}

function getJumpTabValue(homeView, today) {
	const previousSegment = homeView.currentStatusSummary?.previousSegment;
	if (previousSegment && today === previousSegment.startDate) {
		return 'prev-period';
	}
	if (homeView.predictionSummary?.predictedStartDate) {
		return 'prediction';
	}
	return 'today';
}

function hasRecordedNote(note) {
	return typeof note === 'string' && note.trim().length > 0;
}

function hasSelectedPanelDetailRecord(panel) {
	return Boolean(panel && panel.summaryItems.length > 0);
}

function isDetailRecordedDay(dayRecord) {
	return Boolean(dayRecord && (
		dayRecord.flowLevel !== null
		|| dayRecord.painLevel !== null
		|| dayRecord.colorLevel !== null
	));
}

function composeCalendarVariant({ date, today, isPeriod, isPrediction, isDetailRecorded, isSelected }) {
	let variant = 'default';

	if (date > today && !isSelected && isPeriod) {
		variant = 'futurePeriod';
	} else if (date > today && !isSelected && isPrediction) {
		variant = 'futurePrediction';
	} else if (date > today && !isSelected) {
		variant = 'futureMuted';
	} else if (date === today && isPeriod) {
		variant = 'todayPeriod';
	} else if (date === today && isPrediction) {
		variant = 'todayPrediction';
	} else if (date === today) {
		variant = 'today';
	} else if (isPeriod) {
		variant = 'period';
	} else if (isPrediction) {
		variant = 'prediction';
	}

	if (isDetailRecorded) {
		const detailVariantMap = {
			default: 'detail',
			period: 'periodDetail',
			prediction: 'predictionDetail',
			today: 'todayDetail',
			todayPrediction: 'todayPredictionDetail'
		};
		variant = detailVariantMap[variant] || variant;
	}

	if (isSelected) {
		const selectedVariantMap = {
			default: 'selected',
			detail: 'selectedDetail',
			prediction: 'selectedPrediction',
			predictionDetail: 'selectedPredictionDetail',
			period: 'selectedPeriod',
			periodDetail: 'selectedPeriodDetail',
			today: 'selectedToday',
			todayDetail: 'selectedTodayDetail',
			todayPeriod: 'selectedTodayPeriod',
			todayPrediction: 'selectedTodayPrediction',
			todayPredictionDetail: 'selectedTodayPredictionDetail'
		};
		variant = selectedVariantMap[variant] || variant;
	}

	return variant;
}

function updateSelectedCalendarCell(pageModel) {
	const selectedDate = pageModel.selectedDateKey;
	if (!selectedDate) return pageModel;

	const isDetailRecorded = hasSelectedPanelDetailRecord(pageModel.selectedDatePanel);
	pageModel.calendarCard.weeks = pageModel.calendarCard.weeks.map((week) => ({
		...week,
		cells: week.cells.map((cell) => {
			if (cell.key !== selectedDate) {
				return cell;
			}

			const isPeriod = cell.variant.toLowerCase().includes('period');
			const isPrediction = cell.variant.toLowerCase().includes('prediction');

			return {
				...cell,
				variant: composeCalendarVariant({
					date: cell.isoDate,
					today: pageModel.todayKey,
					isPeriod,
					isPrediction,
					isDetailRecorded,
					isSelected: true
				})
			};
		})
	}));

	return pageModel;
}

function createCalendarDatesForViewMode({ focusDate, viewMode, threeWeekWindowStart = null }) {
	if (viewMode === 'month') {
		const monthStart = startOfMonth(focusDate);
		const monthEnd = endOfMonth(focusDate);
		const startDate = startOfWeek(monthStart);
		return createDateRange(startDate, addDays(startOfWeek(monthEnd), 6));
	}

	const startDate = threeWeekWindowStart || addDays(startOfWeek(focusDate), -7);
	return createDateRange(startDate, addDays(startDate, 20));
}

function buildCalendarCard(homeView, moduleSettings, dayDetail, selectedDate, focusDate, viewMode, today, selectedDateKey = null) {
	const periodDates = new Set(
		(homeView.calendarMarks || [])
			.filter((mark) => mark.kind === 'period' || mark.kind === 'period_start')
			.map((mark) => mark.date)
	);
	const predictionDates = createPredictionDateSet(
		homeView.predictionSummary,
		moduleSettings,
		homeView.calendarMarks
	);

	const resolvedFocusDate = focusDate || getFocusDate(homeView, { dayRecord: { date: selectedDate } }, today);
	const focusedNavigation = resolveFocusedNavigation(homeView, resolvedFocusDate);
	const visibleRange = viewMode === 'three-week'
		? resolveVisibleRangeForFocusedNode(homeView, moduleSettings, focusedNavigation)
		: null;
	const days = createCalendarDatesForViewMode({
		focusDate: resolvedFocusDate,
		viewMode,
		threeWeekWindowStart: viewMode === 'three-week'
			? resolveThreeWeekWindowStart({
				focusDate: resolvedFocusDate,
				focusedNavigation,
				visibleRange
			})
			: null
	});

	const weeks = [];
	for (let weekIndex = 0; weekIndex < Math.ceil(days.length / 7); weekIndex += 1) {
		const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
		if (!weekDays.length) break;
		weeks.push({
			key: `week-${weekIndex + 1}`,
			cells: weekDays.map((date) => {
				const isSelected = selectedDateKey ? date === selectedDateKey : false;
				const variant = composeCalendarVariant({
					date,
					today,
					isPeriod: isSelected ? Boolean(dayDetail?.dayRecord?.isPeriod) : periodDates.has(date),
					isPrediction: predictionDates.has(date),
					isDetailRecorded: isSelected ? isDetailRecordedDay(dayDetail?.dayRecord) : false,
					isSelected
				});
				const displayDate = toDateOnly(date);
				return {
					key: date,
					isoDate: date,
					label: String(displayDate.getUTCDate()).padStart(2, '0'),
					variant,
					selectable: date <= today
				};
			})
		});
	}

	return {
		weekdayLabels: [...WEEKDAY_LABELS],
		weeks
	};
}

export function createEmptyDayDetail({ moduleInstanceId, profileId, date }) {
	return {
		moduleInstanceId,
		profileId,
		dayRecord: {
			date,
			isPeriod: false,
			painLevel: null,
			flowLevel: null,
			colorLevel: null,
			note: null,
			source: null,
			isExplicit: false,
			isDetailRecorded: false
		}
	};
}

function buildCalendarCardFromWindow(homeView, moduleSettings, calendarWindow, selectedDate, today, selectedDateKey = null) {
	const dayMap = new Map((calendarWindow.days || []).map((day) => [day.date, day]));
	const predictionDates = createPredictionDateSet(
		homeView.predictionSummary,
		moduleSettings,
		calendarWindow.marks || homeView.calendarMarks || []
	);
	const dates = createDateRange(calendarWindow.window.startDate, calendarWindow.window.endDate);
	const weeks = [];

	for (let index = 0; index < dates.length; index += 7) {
		const weekDays = dates.slice(index, index + 7);
		weeks.push({
			key: `week-${Math.floor(index / 7) + 1}`,
			cells: weekDays.map((date) => {
				const day = dayMap.get(date);
				const isPeriod = Boolean(day?.isPeriod);
				const isToday = date === today;
				const isPrediction = predictionDates.has(date);
				const variant = composeCalendarVariant({
					date,
					today,
					isPeriod,
					isPrediction,
					isDetailRecorded: Boolean(day?.isDetailRecorded),
					isSelected: selectedDateKey ? date === selectedDateKey : false
				});
				const displayDate = toDateOnly(date);

				return {
					key: date,
					isoDate: date,
					label: String(displayDate.getUTCDate()).padStart(2, '0'),
					variant,
					selectable: date <= today
				};
			})
		});
	}

	return {
		weekdayLabels: [...WEEKDAY_LABELS],
		weeks
	};
}

const STATUS_ICON = {
	in_period: '/static/icons/coffee.svg',
	out_of_period: '/static/icons/vacation_1.png'
};

function resolveCycleLengthDays(moduleSettings) {
	const cycleLengthDays = moduleSettings?.defaultCycleLengthDays ?? moduleSettings?.defaultPredictionTermDays;
	return Number.isInteger(cycleLengthDays) && cycleLengthDays > 0 ? cycleLengthDays : null;
}

function resolvePeriodDurationDays(moduleSettings) {
	const durationDays = moduleSettings?.defaultPeriodDurationDays;
	return Number.isInteger(durationDays) && durationDays > 0 ? durationDays : null;
}

export function computePhaseStatus({ homeView, moduleSettings, today }) {
	const currentStatusSummary = homeView?.currentStatusSummary || {};
	const currentSegment = currentStatusSummary.currentSegment || currentStatusSummary.currentCycle || null;
	const predictionSummary = homeView?.predictionSummary || null;
	const cycleLengthDays = resolveCycleLengthDays(moduleSettings);
	const periodDurationDays = resolvePeriodDurationDays(moduleSettings);
	const predictedStartDate = predictionSummary?.predictedStartDate || null;
	const basedOnCycleCount = predictionSummary?.basedOnCycleCount;

	if (!today || !currentSegment?.startDate || !cycleLengthDays || !periodDurationDays) {
		return {
			phase: '卵泡期',
			isLutealLate: false,
			emphasis: false,
			hint: resolveHint('卵泡期', false, null),
			showReliabilityWarning: Number.isInteger(basedOnCycleCount) ? basedOnCycleCount < 3 : false,
			daysUntilNextPeriod: null
		};
	}

	const segmentStartDate = currentSegment.startDate;
	const segmentEndDate = currentSegment.endDate || addDays(segmentStartDate, periodDurationDays - 1);
	const isInCurrentPeriod = today >= segmentStartDate && today <= segmentEndDate;
	const daysUntilNextPeriod = predictedStartDate ? diffDays(today, predictedStartDate) : null;
	const ovulationCenterDate = addDays(segmentStartDate, cycleLengthDays - 14);
	const ovulationWindowStartDate = addDays(ovulationCenterDate, -2);
	const ovulationWindowEndDate = addDays(ovulationCenterDate, 2);
	const lutealLateStartDate = predictedStartDate ? addDays(predictedStartDate, -7) : null;
	const showReliabilityWarning = Number.isInteger(basedOnCycleCount) ? basedOnCycleCount < 3 : false;

	if (isInCurrentPeriod) {
		return {
			phase: '经期',
			isLutealLate: false,
			emphasis: false,
			hint: resolveHint('经期', false, daysUntilNextPeriod),
			showReliabilityWarning,
			daysUntilNextPeriod
		};
	}

	if (today >= ovulationWindowStartDate && today <= ovulationWindowEndDate) {
		return {
			phase: '排卵期',
			isLutealLate: false,
			emphasis: true,
			hint: resolveHint('排卵期', false, daysUntilNextPeriod),
			showReliabilityWarning,
			daysUntilNextPeriod
		};
	}

	if (today > ovulationWindowEndDate) {
		const isLutealLate = Boolean(lutealLateStartDate && today >= lutealLateStartDate && (!predictedStartDate || today < predictedStartDate));
		return {
			phase: '黄体期',
			isLutealLate,
			emphasis: isLutealLate,
			hint: resolveHint('黄体期', isLutealLate, daysUntilNextPeriod),
			showReliabilityWarning,
			daysUntilNextPeriod
		};
	}

	return {
		phase: '卵泡期',
		isLutealLate: false,
		emphasis: false,
		hint: resolveHint('卵泡期', false, daysUntilNextPeriod),
		showReliabilityWarning,
		daysUntilNextPeriod
	};
}

function createHeroCard(homeView, today, moduleSettings = null) {
	const statusSummary = homeView.currentStatusSummary || {};
	// Handle both old field names (status/currentCycle) and new ones (currentStatus/currentSegment)
	const currentStatus = statusSummary.currentStatus || statusSummary.status || 'out_of_period';
	const statusCard = statusSummary.statusCard || {};
	const currentSegment = statusSummary.currentSegment || statusSummary.currentCycle || null;
	const previousSegment = statusSummary.previousSegment || null;
	const prediction = homeView.predictionSummary;

	const statusText = statusCard.label || '非经期';
	const predictedSegmentEndDate = resolvePredictedSegmentEndDate(prediction, moduleSettings);
	const nextFrameValue = prediction
		? predictedSegmentEndDate
			? formatMonthDayRange(prediction.predictedStartDate, predictedSegmentEndDate)
			: formatMonthDayDot(prediction.predictedStartDate)
		: '暂无记录';
	const phaseStatus = computePhaseStatus({
		homeView,
		moduleSettings,
		today
	});

	// When in period: "上次" refers to the previous segment
	// When out of period: "上次" refers to the segment we just exited (current segment)
	const lastSegment = currentStatus === 'in_period' ? previousSegment : currentSegment;

	return {
		label: '当前状态',
		sharingLabel: mapStatusLabel(homeView.sharingStatus),
		statusFrame: {
			state: currentStatus,
			text: statusText,
			iconUrl: STATUS_ICON[currentStatus] || STATUS_ICON.out_of_period,
			phaseStatus
		},
		previousFrame: {
			label: '上次',
			value: lastSegment
				? `${formatMonthDayDot(lastSegment.startDate)} - ${formatMonthDayDot(lastSegment.endDate)}`
				: '暂无记录'
		},
		nextFrame: {
			label: '下次',
			value: nextFrameValue
		}
	};
}

function createSelectedDatePanel(homeView, dayDetail, today, singleDayPeriodAction = null) {
	const dayRecord = dayDetail?.dayRecord || null;
	const summaryItems = createSummaryItems(dayRecord);
	const hasAnyRecord = Boolean(dayRecord && (
		dayRecord.isPeriod
		|| dayRecord.painLevel !== null
		|| dayRecord.flowLevel !== null
		|| dayRecord.colorLevel !== null
		|| Boolean(dayRecord.note)
	));
	const date = dayRecord?.date || today;
	const periodChip = singleDayPeriodAction?.chip || deriveSingleDayPeriodChip({ homeView, dayRecord });
	const isEditable = date <= today;

	return {
		title: formatHumanDate(date),
		badge: date === today ? '今日' : (hasAnyRecord ? '已记录' : '点击记录'),
		periodChipText: periodChip.text,
		periodChipSelected: periodChip.selected,
		initialPeriodMarked: Boolean(dayRecord?.isPeriod),
		initialEditorOpen: false,
		isEditable,
		note: dayRecord?.note || '',
		summaryItems,
		attributeRows: createOptionRows(dayRecord)
	};
}

function rebuildSummaryItemsFromRows(attributeRows) {
	return attributeRows
		.map((row) => {
			const selected = row.options.find((option) => option.selected);
			if (!selected) return null;
			return {
				key: row.key,
				label: ROW_ITEM_META[row.key].label,
				icon: ROW_ITEM_META[row.key].icon,
				tone: selected.tone,
				value: selected.label
			};
		})
		.filter(Boolean);
}

function cloneDayRecordFromPanel(pageModel) {
	const panel = pageModel.selectedDatePanel;
	const rows = panel.attributeRows || [];
	const selectedLevel = (rowKey) => {
		const row = rows.find((item) => item.key === rowKey);
		if (!row) return null;
		const index = row.options.findIndex((option) => option.selected);
		return index === -1 ? null : index + 1;
	};

	return {
		date: pageModel.selectedDateKey,
		isPeriod: Boolean(panel.initialPeriodMarked),
		painLevel: selectedLevel('pain'),
		flowLevel: selectedLevel('flow'),
		colorLevel: selectedLevel('color'),
		note: panel.note || null
	};
}

function buildVisiblePeriodDates(pageModel, overrides = {}) {
	const periodDates = new Set();
	const detailRecordedDates = new Set();

	pageModel.calendarCard.weeks.forEach((week) => {
		week.cells.forEach((cell) => {
			if (cell.variant?.toLowerCase().includes('period')) {
				periodDates.add(cell.isoDate);
			}
			if (cell.variant?.includes('Detail')) {
				detailRecordedDates.add(cell.isoDate);
			}
		});
	});

	Object.entries(overrides).forEach(([isoDate, nextState]) => {
		if (nextState?.isPeriod) {
			periodDates.add(isoDate);
		} else {
			periodDates.delete(isoDate);
		}
		if (nextState?.isDetailRecorded) {
			detailRecordedDates.add(isoDate);
		} else {
			detailRecordedDates.delete(isoDate);
		}
	});

	return { periodDates, detailRecordedDates };
}

function deriveChipFromPeriodDates(selectedDate, periodDates) {
	if (!selectedDate || !periodDates.has(selectedDate)) {
		return {
			text: '月经',
			selected: false
		};
	}

	const hasPreviousPeriod = periodDates.has(addDays(selectedDate, -1));
	const hasNextPeriod = periodDates.has(addDays(selectedDate, 1));
	return {
		text: hasPreviousPeriod ? '月经结束' : '月经开始',
		selected: true
	};
}

function patchCalendarCells(pageModel, overrides = {}) {
	const { periodDates, detailRecordedDates } = buildVisiblePeriodDates(pageModel, overrides);
	pageModel.calendarCard.weeks = pageModel.calendarCard.weeks.map((week) => ({
		...week,
		cells: week.cells.map((cell) => {
			const stateOverride = overrides[cell.isoDate];
			const isPeriod = stateOverride ? stateOverride.isPeriod : periodDates.has(cell.isoDate);
			const isDetailRecorded = stateOverride ? stateOverride.isDetailRecorded : detailRecordedDates.has(cell.isoDate);
			return {
				...cell,
				variant: composeCalendarVariant({
					date: cell.isoDate,
					today: pageModel.todayKey,
					isPeriod,
					isPrediction: cell.variant.toLowerCase().includes('prediction'),
					isDetailRecorded,
					isSelected: cell.key === pageModel.selectedDateKey
				})
			};
		})
	}));
	return { periodDates, detailRecordedDates };
}

function refreshCalendarPredictionOverlays(pageModel, homeView, moduleSettings) {
	const predictionDates = createPredictionDateSet(
		homeView?.predictionSummary,
		moduleSettings,
		homeView?.calendarMarks || []
	);

	pageModel.calendarCard.weeks = pageModel.calendarCard.weeks.map((week) => ({
		...week,
		cells: week.cells.map((cell) => {
			const variantLower = String(cell.variant || '').toLowerCase();
			const isPeriod = variantLower.includes('period') && !variantLower.includes('prediction');
			const isDetailRecorded = String(cell.variant || '').includes('Detail');
			return {
				...cell,
				variant: composeCalendarVariant({
					date: cell.isoDate,
					today: pageModel.todayKey,
					isPeriod,
					isPrediction: predictionDates.has(cell.isoDate),
					isDetailRecorded,
					isSelected: cell.key === pageModel.selectedDateKey
				})
			};
		})
	}));
}

function clonePageModel(pageModel) {
	return {
		...pageModel,
		topBar: { ...pageModel.topBar },
		heroCard: {
			...pageModel.heroCard,
			statusFrame: { ...pageModel.heroCard.statusFrame },
			previousFrame: { ...pageModel.heroCard.previousFrame },
			nextFrame: { ...pageModel.heroCard.nextFrame }
		},
		headerNav: { ...pageModel.headerNav },
		jumpTabs: {
			...pageModel.jumpTabs,
			items: pageModel.jumpTabs.items.map((item) => ({ ...item }))
		},
		viewModeControl: {
			...pageModel.viewModeControl,
			options: pageModel.viewModeControl.options.map((item) => ({ ...item }))
		},
		calendarCard: {
			...pageModel.calendarCard,
			weekdayLabels: [...pageModel.calendarCard.weekdayLabels],
			weeks: pageModel.calendarCard.weeks.map((week) => ({
				...week,
				cells: week.cells.map((cell) => ({ ...cell }))
			}))
		},
		legend: pageModel.legend.map((item) => ({ ...item })),
		selectedDatePanel: {
			...pageModel.selectedDatePanel,
			note: pageModel.selectedDatePanel.note,
			summaryItems: pageModel.selectedDatePanel.summaryItems.map((item) => ({ ...item })),
			attributeRows: pageModel.selectedDatePanel.attributeRows.map((row) => ({
				...row,
				options: row.options.map((option) => ({ ...option }))
			}))
		}
	};
}

export function resolveJumpTargetDate(homeView, jumpKey, today) {
	if (jumpKey === 'today') return today;
	if (jumpKey === 'prev-period') {
		const statusSummary = homeView.currentStatusSummary || {};
		const currentStatus = statusSummary.currentStatus || statusSummary.status || 'out_of_period';
		const lastSegment = currentStatus === 'in_period'
			? statusSummary.previousSegment
			: (statusSummary.currentSegment || statusSummary.currentCycle);
		return lastSegment?.startDate || null;
	}
	if (jumpKey === 'prediction') return homeView.predictionSummary?.predictedStartDate || null;
	return null;
}

export function shiftFocusDate(focusDate, viewMode, direction) {
	if (viewMode === 'month') {
		const date = toDateOnly(focusDate);
		date.setUTCMonth(date.getUTCMonth() + direction, 1);
		return formatYMD(date);
	}

	return addDays(focusDate, direction * 7);
}

export function createMenstrualHomePageModel({
	homeView,
	moduleSettings = null,
	dayDetail,
	calendarWindow = null,
	singleDayPeriodAction = null,
	today,
	viewMode = 'three-week',
	focusDate = null,
	selectedDateKey = null
}) {
	const activeDate = dayDetail?.dayRecord?.date || today;
	const resolvedFocusDate = focusDate || activeDate;
	const focusedNavigation = resolveFocusedNavigation(homeView, resolvedFocusDate, calendarWindow?.marks || []);
	const resolvedSelectedDateKey = selectedDateKey || null;

	return {
		topBar: {
			title: '经期小记',
			statusLabel: mapStatusLabel(homeView.sharingStatus)
		},
		heroCard: createHeroCard(homeView, today, moduleSettings),
		headerNav: {
			...(() => {
				if (viewMode !== 'three-week') {
					return {
						monthLabel: formatMonthLabel(resolvedFocusDate),
						startYearLabel: '',
						endYearLabel: '',
						previousPeriodStart: null,
						nextPeriodStart: null,
						focusedNodeType: null,
						focusedAnchorDate: resolvedFocusDate,
						isForwardBoundary: false,
						isBackwardBoundary: false
					};
				}
				const windowStartDate = addDays(startOfWeek(resolvedFocusDate), -7);
				const windowEndDate = addDays(windowStartDate, 20);
				return {
					...formatWindowMonthHeader(windowStartDate, windowEndDate),
					...focusedNavigation
				};
			})(),
			leadingLabel: '‹',
			trailingLabel: '›'
		},
		jumpTabs: {
			value: (() => {
				const prevPeriodTarget = resolveJumpTargetDate(homeView, 'prev-period', today);
				const predictionTarget = resolveJumpTargetDate(homeView, 'prediction', today);
				if (resolvedFocusDate === today) return 'today';
				if (prevPeriodTarget && resolvedFocusDate === prevPeriodTarget) return 'prev-period';
				if (predictionTarget && resolvedFocusDate === predictionTarget) return 'prediction';
				return getJumpTabValue(homeView, today);
			})(),
			items: [
				{ key: 'today', label: '今天', tone: 'outlined', disabled: false },
				{ key: 'prediction', label: '下次预测', tone: 'soft', disabled: !homeView.predictionSummary },
				{ key: '_sep', type: 'label', label: '按经期定位' },
				{ key: 'prev-period', label: '向前', tone: 'muted', disabled: (() => { const s = homeView.currentStatusSummary || {}; const cs = s.currentStatus || s.status || 'out_of_period'; const ls = cs === 'in_period' ? s.previousSegment : (s.currentSegment || s.currentCycle); return !ls; })() },
				{ key: 'next-period', label: '向后', tone: 'muted', disabled: !homeView.predictionSummary }
			]
		},
		viewModeControl: {
			value: viewMode,
			options: [
				{ key: 'three-week', label: '聚焦模式' },
				{ key: 'month', label: '月览' }
			]
		},
		calendarCard: calendarWindow
			? buildCalendarCardFromWindow(homeView, moduleSettings, calendarWindow, activeDate, today, resolvedSelectedDateKey)
			: buildCalendarCard(homeView, moduleSettings, dayDetail, activeDate, resolvedFocusDate, viewMode, today, resolvedSelectedDateKey),
		legend: createCalendarLegendItems(),
		selectedDatePanel: createSelectedDatePanel(homeView, dayDetail, today, singleDayPeriodAction),
		reportEntryCard: {
			title: '周期小结',
			description: '看看周期节奏和过往记录',
			iconUrl: '/static/menstrual/report.svg',
			targetUrl: '/pages/menstrual/report'
		},
		selectedDateKey: resolvedSelectedDateKey,
		todayKey: today
	};
}

export function applyHeroSnapshotToPageModel(pageModel, { homeView, moduleSettings = null, today }) {
	const next = clonePageModel(pageModel);
	const previousJumpValue = next.jumpTabs.value;
	next.topBar.statusLabel = mapStatusLabel(homeView?.sharingStatus);
	next.heroCard = createHeroCard(homeView || {}, today, moduleSettings);
	refreshCalendarPredictionOverlays(next, homeView || {}, moduleSettings);
	next.jumpTabs.items = [
		{ key: 'today', label: '今天', tone: 'outlined', disabled: false },
		{
			key: 'prediction',
			label: '下次预测',
			tone: 'soft',
			disabled: !homeView?.predictionSummary
		},
		{ key: '_sep', type: 'label', label: '按经期定位' },
		{
			key: 'prev-period',
			label: '向前',
			tone: 'muted',
			disabled: (() => {
				const summary = homeView?.currentStatusSummary || {};
				const currentStatus = summary.currentStatus || summary.status || 'out_of_period';
				const lastSegment = currentStatus === 'in_period'
					? summary.previousSegment
					: (summary.currentSegment || summary.currentCycle);
				return !lastSegment;
			})()
		},
		{ key: 'next-period', label: '向后', tone: 'muted', disabled: !homeView?.predictionSummary }
	];
	next.jumpTabs.value = ['today', 'prev-period', 'next-period', 'prediction'].includes(previousJumpValue)
		? previousJumpValue
		: getJumpTabValue(homeView || {}, today);
	return next;
}

export function applyToggleAttributeOptionToPageModel(pageModel, { rowKey, optionKey }) {
	const next = clonePageModel(pageModel);
	const targetRow = next.selectedDatePanel.attributeRows.find((row) => row.key === rowKey);
	if (!targetRow) return next;

	const tappedOption = targetRow.options.find((option) => option.key === optionKey);
	if (!tappedOption) return next;

	const nextSelectedState = !tappedOption.selected;
	targetRow.options = targetRow.options.map((option) => ({
		...option,
		selected: option.key === optionKey ? nextSelectedState : false
	}));

	next.selectedDatePanel.summaryItems = rebuildSummaryItemsFromRows(next.selectedDatePanel.attributeRows);
	return updateSelectedCalendarCell(next);
}

export function applyClearAttributesToPageModel(pageModel) {
	const next = clonePageModel(pageModel);
	next.selectedDatePanel.attributeRows = next.selectedDatePanel.attributeRows.map((row) => ({
		...row,
		options: row.options.map((option) => ({ ...option, selected: false }))
	}));
	next.selectedDatePanel.summaryItems = [];
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (next.selectedDatePanel.initialPeriodMarked || hasSelectedPanelDetailRecord(next.selectedDatePanel))
			? '已记录'
			: '点击记录';
	}
	return updateSelectedCalendarCell(next);
}

export function applyTogglePeriodToPageModel(pageModel, isPeriodMarked) {
	const next = clonePageModel(pageModel);
	next.selectedDatePanel.initialPeriodMarked = isPeriodMarked;
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (isPeriodMarked || hasSelectedPanelDetailRecord(next.selectedDatePanel))
			? '已记录'
			: '点击记录';
	}
	return next;
}

export function applySingleDayPeriodActionToPageModel(pageModel, { resolvedAction }) {
	const next = clonePageModel(pageModel);
	const selectedDate = next.selectedDateKey;
	const dayRecord = cloneDayRecordFromPanel(next);
	const effect = resolvedAction?.effect || { writeDates: [], clearDates: [] };
	const writeDates = new Set(effect.writeDates || []);
	const clearDates = new Set(effect.clearDates || []);
	const selectedIsPeriod = writeDates.has(selectedDate) ? true : clearDates.has(selectedDate) ? false : dayRecord.isPeriod;

	next.selectedDatePanel.initialPeriodMarked = selectedIsPeriod;
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (
			selectedIsPeriod
			|| hasSelectedPanelDetailRecord(next.selectedDatePanel)
		) ? '已记录' : '点击记录';
	}

	const overrides = {};
	writeDates.forEach((isoDate) => {
		overrides[isoDate] = {
			isPeriod: true,
			isDetailRecorded: isoDate === selectedDate
				? hasSelectedPanelDetailRecord(next.selectedDatePanel)
				: next.calendarCard.weeks.flatMap((week) => week.cells).find((cell) => cell.isoDate === isoDate)?.variant?.includes('Detail') || false
		};
	});
	clearDates.forEach((isoDate) => {
		overrides[isoDate] = {
			isPeriod: false,
			isDetailRecorded: isoDate === selectedDate
				? hasSelectedPanelDetailRecord(next.selectedDatePanel)
				: next.calendarCard.weeks.flatMap((week) => week.cells).find((cell) => cell.isoDate === isoDate)?.variant?.includes('Detail') || false
		};
	});

	const { periodDates } = patchCalendarCells(next, overrides);
	const chip = deriveChipFromPeriodDates(selectedDate, periodDates);
	next.selectedDatePanel.periodChipText = chip.text;
	next.selectedDatePanel.periodChipSelected = chip.selected;
	return next;
}

export function applyBatchPeriodDraftToPageModel(pageModel, { selectedKeys, batchDraft, activeDate }) {
	const next = clonePageModel(pageModel);
	const targetDateKey = activeDate || next.selectedDateKey;
	next.selectedDatePanel.title = formatHumanDate(targetDateKey);
	next.selectedDatePanel.note = next.selectedDatePanel.note || '';
	next.selectedDatePanel.summaryItems = createSummaryItems({
		flowLevel: batchDraft.flowLevel ?? null,
		painLevel: batchDraft.painLevel ?? null,
		colorLevel: batchDraft.colorLevel ?? null
	});
	next.selectedDatePanel.attributeRows = createOptionRows({
		flowLevel: batchDraft.flowLevel ?? null,
		painLevel: batchDraft.painLevel ?? null,
		colorLevel: batchDraft.colorLevel ?? null
	});
	next.selectedDatePanel.initialPeriodMarked = Boolean(batchDraft.isPeriod);
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (
			Boolean(batchDraft.isPeriod)
			|| hasSelectedPanelDetailRecord(next.selectedDatePanel)
		) ? '已记录' : '点击记录';
	}

	const selectedSet = new Set(selectedKeys || []);
	const overrides = {};
	next.calendarCard.weeks.flatMap((week) => week.cells).forEach((cell) => {
		if (!selectedSet.has(cell.key)) return;
		overrides[cell.isoDate] = {
			isPeriod: Boolean(batchDraft.isPeriod),
			isDetailRecorded: cell.isoDate === targetDateKey
				? hasSelectedPanelDetailRecord(next.selectedDatePanel)
				: cell.variant?.includes('Detail') || false
		};
	});

	const { periodDates } = patchCalendarCells(next, overrides);
	const chip = deriveChipFromPeriodDates(targetDateKey, periodDates);
	next.selectedDatePanel.periodChipText = chip.text;
	next.selectedDatePanel.periodChipSelected = chip.selected;
	return next;
}

export function applySelectedDateNoteToPageModel(pageModel, note) {
	const next = clonePageModel(pageModel);
	next.selectedDatePanel.note = note;
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (
			next.selectedDatePanel.initialPeriodMarked
			|| hasSelectedPanelDetailRecord(next.selectedDatePanel)
		)
			? '已记录'
			: '点击记录';
	}
	return updateSelectedCalendarCell(next);
}

export function createSeededHomeContracts() {
	const todayStr = '2026-03-29';
	const periodStartStr = '2026-03-21';
	const periodEndStr = '2026-03-26';
	const predictionStartStr = '2026-04-20';
	const predictionWindowStartStr = '2026-04-18';
	const predictionWindowEndStr = '2026-04-24';

	// Generate period marks between periodStart and periodEnd
	const calendarMarks = [{ date: todayStr, kind: 'today' }];
	const currentDate = toDateOnly(periodStartStr);
	let isFirst = true;
	const periodEnd = toDateOnly(periodEndStr);
	while (currentDate <= periodEnd) {
		const dateStr = currentDate.toISOString().slice(0, 10);
		calendarMarks.push({
			date: dateStr,
			kind: isFirst ? 'period_start' : 'period'
		});
		isFirst = false;
		currentDate.setDate(currentDate.getDate() + 1);
	}
	calendarMarks.push({ date: predictionStartStr, kind: 'prediction_start' });

	return {
		homeView: {
			moduleInstanceId: 'seed-home-module',
			sharingStatus: 'private',
			currentStatusSummary: {
				currentStatus: 'out_of_period',
				anchorDate: periodStartStr,
				currentSegment: {
					startDate: periodStartStr,
					endDate: periodEndStr,
					durationDays: 6
				},
				statusCard: {
					label: '非经期'
				},
				previousSegment: null
			},
			visibleWindow: {
				kind: 'cycle_window',
				startDate: periodStartStr,
				endDate: predictionWindowEndStr
			},
			calendarMarks,
			selectedDay: null,
			predictionSummary: {
				predictedStartDate: predictionStartStr,
				predictionWindowStart: predictionWindowStartStr,
				predictionWindowEnd: predictionWindowEndStr,
				basedOnCycleCount: 3
			}
		},
		moduleSettings: {
			defaultPeriodDurationDays: 6,
			defaultPredictionTermDays: 22
		},
		dayDetail: {
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			dayRecord: {
				date: todayStr,
				isPeriod: false,
				painLevel: null,
				flowLevel: null,
				colorLevel: null,
				note: null,
				source: null,
				isExplicit: false,
				isDetailRecorded: false
			}
		}
	};
}
