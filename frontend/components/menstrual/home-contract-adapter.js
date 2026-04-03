import { createCalendarLegendItems } from './calendar-legend-data.js';

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

function formatHumanDate(dateString) {
	const date = toDateOnly(dateString);
	return `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

function formatMonthLabel(dateString) {
	const date = toDateOnly(dateString);
	return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
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
		return 'previous';
	}
	if (homeView.predictionSummary?.predictedStartDate) {
		return 'prediction';
	}
	return 'today';
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

	if (date > today && !isSelected) {
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

	const isDetailRecorded = pageModel.selectedDatePanel.summaryItems.length > 0;
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

function createCalendarDatesForViewMode({ focusDate, viewMode }) {
	if (viewMode === 'month') {
		const monthStart = startOfMonth(focusDate);
		const monthEnd = endOfMonth(focusDate);
		const startDate = startOfWeek(monthStart);
		return createDateRange(startDate, addDays(startOfWeek(monthEnd), 6));
	}

	const startDate = addDays(startOfWeek(focusDate), -7);
	return createDateRange(startDate, addDays(startDate, 20));
}

function buildCalendarCard(homeView, dayDetail, selectedDate, focusDate, viewMode, today) {
	const periodDates = new Set(
		(homeView.calendarMarks || [])
			.filter((mark) => mark.kind === 'period' || mark.kind === 'period_start')
			.map((mark) => mark.date)
	);
	const predictionDates = new Set(
		homeView.predictionSummary
			? createDateRange(homeView.predictionSummary.predictionWindowStart, homeView.predictionSummary.predictionWindowEnd)
			: []
	);

	const resolvedFocusDate = focusDate || getFocusDate(homeView, { dayRecord: { date: selectedDate } }, today);
	const days = createCalendarDatesForViewMode({
		focusDate: resolvedFocusDate,
		viewMode
	});

	const weeks = [];
	for (let weekIndex = 0; weekIndex < Math.ceil(days.length / 7); weekIndex += 1) {
		const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
		if (!weekDays.length) break;
		weeks.push({
			key: `week-${weekIndex + 1}`,
			cells: weekDays.map((date) => {
				const isSelected = date === selectedDate;
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

function buildCalendarCardFromWindow(homeView, calendarWindow, selectedDate, today) {
	const dayMap = new Map((calendarWindow.days || []).map((day) => [day.date, day]));
	const predictionDates = new Set(
		homeView.predictionSummary
			? createDateRange(homeView.predictionSummary.predictionWindowStart, homeView.predictionSummary.predictionWindowEnd)
			: []
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
					isSelected: date === selectedDate
				});
				const displayDate = toDateOnly(date);

				return {
					key: date,
					isoDate: date,
					label: String(displayDate.getUTCDate()).padStart(2, '0'),
					variant,
					selectable: !isPrediction && date <= today
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

function createHeroCard(homeView, today) {
	const statusSummary = homeView.currentStatusSummary || {};
	// Handle both old field names (status/currentCycle) and new ones (currentStatus/currentSegment)
	const currentStatus = statusSummary.currentStatus || statusSummary.status || 'out_of_period';
	const statusCard = statusSummary.statusCard || {};
	const currentSegment = statusSummary.currentSegment || statusSummary.currentCycle || null;
	const previousSegment = statusSummary.previousSegment || null;
	const prediction = homeView.predictionSummary;

	const statusText = statusCard.label || '非经期';
	const nextFrameValue = prediction
		? formatMonthDayDot(prediction.predictedStartDate)
		: '暂无记录';

	// When in period: "上次" refers to the previous segment
	// When out of period: "上次" refers to the segment we just exited (current segment)
	const lastSegment = currentStatus === 'in_period' ? previousSegment : currentSegment;

	return {
		label: '当前状态',
		sharingLabel: mapStatusLabel(homeView.sharingStatus),
		statusFrame: {
			state: currentStatus,
			text: statusText,
			iconUrl: STATUS_ICON[currentStatus] || STATUS_ICON.out_of_period
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

	return {
		title: formatHumanDate(date),
		badge: date === today ? '今日' : (hasAnyRecord ? '已记录' : '点击记录'),
		periodChipText: periodChip.text,
		periodChipSelected: periodChip.selected,
		initialPeriodMarked: Boolean(dayRecord?.isPeriod),
		initialEditorOpen: false,
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
	if (jumpKey === 'previous') {
		const statusSummary = homeView.currentStatusSummary || {};
		// Handle both old field names (status) and new ones (currentStatus)
		const currentStatus = statusSummary.currentStatus || statusSummary.status || 'out_of_period';
		// When in period: "上次" refers to previousSegment
		// When out of period: "上次" refers to the segment we just exited (currentSegment)
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
	dayDetail,
	calendarWindow = null,
	singleDayPeriodAction = null,
	today,
	viewMode = 'three-week',
	focusDate = null
}) {
	const activeDate = dayDetail?.dayRecord?.date || today;
	const resolvedFocusDate = focusDate || activeDate;

	return {
		topBar: {
			title: '月经记录',
			statusLabel: mapStatusLabel(homeView.sharingStatus)
		},
		heroCard: createHeroCard(homeView, today),
		headerNav: {
			monthLabel: formatMonthLabel(resolvedFocusDate),
			leadingLabel: '‹',
			trailingLabel: '›'
		},
		jumpTabs: {
			value: (() => {
				const previousTarget = resolveJumpTargetDate(homeView, 'previous', today);
				const predictionTarget = resolveJumpTargetDate(homeView, 'prediction', today);
				if (resolvedFocusDate === today) return 'today';
				if (previousTarget && resolvedFocusDate === previousTarget) return 'previous';
				if (predictionTarget && resolvedFocusDate === predictionTarget) return 'prediction';
				return getJumpTabValue(homeView, today);
			})(),
			items: [
				{ key: 'today', label: '今天', tone: 'outlined', disabled: false },
				{ key: 'previous', label: '上次', tone: 'muted', disabled: (() => { const s = homeView.currentStatusSummary || {}; const cs = s.currentStatus || s.status || 'out_of_period'; const ls = cs === 'in_period' ? s.previousSegment : (s.currentSegment || s.currentCycle); return !ls; })() },
				{ key: 'prediction', label: '下次预测', tone: 'soft', disabled: !homeView.predictionSummary }
			]
		},
		viewModeControl: {
			value: viewMode,
			options: [
				{ key: 'three-week', label: '3 周' },
				{ key: 'month', label: '月览' }
			]
		},
		calendarCard: calendarWindow
			? buildCalendarCardFromWindow(homeView, calendarWindow, activeDate, today)
			: buildCalendarCard(homeView, dayDetail, activeDate, resolvedFocusDate, viewMode, today),
		legend: createCalendarLegendItems(),
		selectedDatePanel: createSelectedDatePanel(homeView, dayDetail, today, singleDayPeriodAction),
		selectedDateKey: activeDate,
		todayKey: today
	};
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
	return updateSelectedCalendarCell(next);
}

export function applyTogglePeriodToPageModel(pageModel, isPeriodMarked) {
	const next = clonePageModel(pageModel);
	next.selectedDatePanel.initialPeriodMarked = isPeriodMarked;
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (isPeriodMarked || next.selectedDatePanel.summaryItems.length > 0 || Boolean(next.selectedDatePanel.note))
			? '已记录'
			: '点击记录';
	}
	return next;
}

export function applySelectedDateNoteToPageModel(pageModel, note) {
	const next = clonePageModel(pageModel);
	next.selectedDatePanel.note = note;
	if (next.selectedDatePanel.badge !== '今日') {
		next.selectedDatePanel.badge = (
			next.selectedDatePanel.initialPeriodMarked
			|| next.selectedDatePanel.summaryItems.length > 0
			|| Boolean(note)
		)
			? '已记录'
			: '点击记录';
	}
	return next;
}

export function createSeededHomeContracts() {
	const today = new Date();
	const todayStr = today.toISOString().slice(0, 10);

	// Create a period that ended 3 days ago, for testing "上次" display
	const periodEnd = new Date(today);
	periodEnd.setDate(periodEnd.getDate() - 3);
	const periodEndStr = periodEnd.toISOString().slice(0, 10);

	const periodStart = new Date(periodEnd);
	periodStart.setDate(periodStart.getDate() - 5);  // 6-day period
	const periodStartStr = periodStart.toISOString().slice(0, 10);

	// Prediction starts in ~22 days
	const predictionStart = new Date(today);
	predictionStart.setDate(predictionStart.getDate() + 22);
	const predictionStartStr = predictionStart.toISOString().slice(0, 10);

	const predictionWindowStart = new Date(predictionStart);
	predictionWindowStart.setDate(predictionWindowStart.getDate() - 2);
	const predictionWindowStartStr = predictionWindowStart.toISOString().slice(0, 10);

	const predictionWindowEnd = new Date(predictionStart);
	predictionWindowEnd.setDate(predictionWindowEnd.getDate() + 4);
	const predictionWindowEndStr = predictionWindowEnd.toISOString().slice(0, 10);

	// Generate period marks between periodStart and periodEnd
	const calendarMarks = [{ date: todayStr, kind: 'today' }];
	const currentDate = new Date(periodStart);
	let isFirst = true;
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
