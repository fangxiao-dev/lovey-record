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

function diffDays(startDate, endDate) {
	const start = toDateOnly(startDate);
	const end = toDateOnly(endDate);
	return Math.round((end - start) / 86400000);
}

function createOptionRows(dayRecord) {
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

function createSummaryItems(dayRecord) {
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
	const segment = getCurrentSegment(homeView);
	if (segment && today >= segment.startDate && today <= segment.endDate) {
		return 'current';
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
			today: 'todayDetail'
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
			todayPrediction: 'selectedTodayPrediction'
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

function buildCalendarCard(homeView, dayDetail, selectedDate, today) {
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

	const focusDate = getFocusDate(homeView, { dayRecord: { date: selectedDate } }, today);
	const firstWeekStart = addDays(startOfWeek(focusDate), -7);
	const days = createDateRange(firstWeekStart, addDays(firstWeekStart, 20));

	const weeks = [];
	for (let weekIndex = 0; weekIndex < 3; weekIndex += 1) {
		const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
		weeks.push({
			key: `week-${weekIndex + 1}`,
			cells: weekDays.map((date) => {
				const variant = composeCalendarVariant({
					date,
					today,
					isPeriod: periodDates.has(date),
					isPrediction: predictionDates.has(date),
					isDetailRecorded: date === selectedDate ? isDetailRecordedDay(dayDetail?.dayRecord) : false,
					isSelected: date === selectedDate
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

function createHeroCard(homeView, today) {
	const segment = getCurrentSegment(homeView);
	const prediction = homeView.predictionSummary;
	const inPeriod = homeView.currentStatusSummary?.status === 'in_period' && segment;
	const currentDayNumber = inPeriod ? diffDays(segment.startDate, today) + 1 : null;

	return {
		eyebrow: '当前状态',
		title: inPeriod ? `经期第 ${currentDayNumber} 天` : (prediction ? '下一次经期预测' : '等待记录'),
		copy: '先看当前状态，再在下方 3 周视图里定位和记录。',
		currentRange: {
			label: '本次经期',
			value: segment ? `${formatMonthDay(segment.startDate)} - ${formatMonthDay(segment.endDate)}` : '--'
		},
		predictionRange: {
			label: '下次预测',
			value: prediction ? formatMonthDay(prediction.predictedStartDate) : '--'
		}
	};
}

function createSelectedDatePanel(dayDetail, today) {
	const dayRecord = dayDetail?.dayRecord || null;
	const summaryItems = createSummaryItems(dayRecord);
	const hasAnyRecord = Boolean(dayRecord && (
		dayRecord.isPeriod
		|| dayRecord.painLevel !== null
		|| dayRecord.flowLevel !== null
		|| dayRecord.colorLevel !== null
	));
	const date = dayRecord?.date || today;

	return {
		title: formatHumanDate(date),
		badge: date === today ? '今日' : (hasAnyRecord ? '已记录' : '点击记录'),
		initialPeriodMarked: Boolean(dayRecord?.isPeriod),
		initialEditorOpen: false,
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
			currentRange: { ...pageModel.heroCard.currentRange },
			predictionRange: { ...pageModel.heroCard.predictionRange }
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
	if (jumpKey === 'current') return getCurrentSegment(homeView)?.startDate || null;
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

export function createMenstrualHomePageModel({ homeView, dayDetail, calendarWindow = null, today, viewMode = 'three-week', focusDate = null }) {
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
				const currentTarget = resolveJumpTargetDate(homeView, 'current', today);
				const predictionTarget = resolveJumpTargetDate(homeView, 'prediction', today);
				if (resolvedFocusDate === today) return 'today';
				if (currentTarget && resolvedFocusDate === currentTarget) return 'current';
				if (predictionTarget && resolvedFocusDate === predictionTarget) return 'prediction';
				return getJumpTabValue(homeView, today);
			})(),
			items: [
				{ key: 'today', label: '今天', tone: 'outlined', disabled: false },
				{ key: 'current', label: '本次', tone: 'accent', disabled: !getCurrentSegment(homeView) },
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
			: buildCalendarCard(homeView, dayDetail, activeDate, today),
		legend: createCalendarLegendItems(),
		selectedDatePanel: createSelectedDatePanel(dayDetail, today),
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
		next.selectedDatePanel.badge = (isPeriodMarked || next.selectedDatePanel.summaryItems.length > 0)
			? '已记录'
			: '点击记录';
	}
	return next;
}

export function createSeededHomeContracts() {
	return {
		homeView: {
			moduleInstanceId: 'seed-home-module',
			sharingStatus: 'private',
			currentStatusSummary: {
				status: 'in_period',
				anchorDate: '2026-03-26',
				currentCycle: {
					startDate: '2026-03-26',
					endDate: '2026-03-31',
					durationDays: 6
				}
			},
			visibleWindow: {
				kind: 'cycle_window',
				startDate: '2026-03-26',
				endDate: '2026-04-27'
			},
			calendarMarks: [
				{ date: '2026-03-26', kind: 'period_start' },
				{ date: '2026-03-27', kind: 'period' },
				{ date: '2026-03-28', kind: 'period' },
				{ date: '2026-03-29', kind: 'period' },
				{ date: '2026-03-30', kind: 'period' },
				{ date: '2026-03-31', kind: 'period' },
				{ date: '2026-03-29', kind: 'today' },
				{ date: '2026-04-25', kind: 'prediction_start' }
			],
			selectedDay: null,
			predictionSummary: {
				predictedStartDate: '2026-04-25',
				predictionWindowStart: '2026-04-23',
				predictionWindowEnd: '2026-04-27',
				basedOnCycleCount: 3
			}
		},
		dayDetail: {
			moduleInstanceId: 'seed-home-module',
			profileId: 'seed-home-profile',
			dayRecord: {
				date: '2026-03-29',
				isPeriod: true,
				painLevel: 3,
				flowLevel: 3,
				colorLevel: 3,
				note: null,
				source: 'auto_filled',
				isExplicit: true,
				isDetailRecorded: true
			}
		}
	};
}
