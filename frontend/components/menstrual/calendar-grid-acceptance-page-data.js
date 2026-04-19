import { createCalendarLegendItems } from './calendar-legend-data.js';
import { createSelectedDatePanelData } from './selected-date-panel-data.js';

const CALENDAR_GRID_ACCEPTANCE_PAGE = Object.freeze({
	topBar: {
		title: '经期小记',
		statusLabel: '共享'
	},
	heroCard: {
		eyebrow: '当前状态',
		title: '经期第 2 天',
		copy: '先看当前状态，再在下方 3 周视图里定位和记录。',
		currentRange: { label: '本次经期', value: '03/20' },
		predictionRange: { label: '下次预测', value: '04/16' }
	},
	headerNav: {
		monthLabel: '2026.03',
		leadingLabel: '‹',
		trailingLabel: '›'
	},
	jumpTabs: {
		value: 'current',
		items: [
			{ key: 'today', label: '今天', tone: 'outlined' },
			{ key: 'current', label: '本次', tone: 'accent' },
			{ key: 'prediction', label: '下次预测', tone: 'soft' }
		]
	},
	viewModeControl: {
		value: 'three-week',
		options: [
			{ key: 'three-week', label: '3 周' },
			{ key: 'month', label: '月览' }
		]
	},
	calendarCard: {
		weekdayLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
		weeks: [
			{
				key: 'week-1',
				cells: [
					{ key: 'w1-1', label: '17', variant: 'default' },
					{ key: 'w1-2', label: '18', variant: 'period' },
					{ key: 'w1-3', label: '19', variant: 'period' },
					{ key: 'w1-4', label: '20', variant: 'period' },
					{ key: 'w1-5', label: '21', variant: 'period' },
					{ key: 'w1-6', label: '22', variant: 'periodDetail' },
					{ key: 'w1-7', label: '23', variant: 'prediction' }
				]
			},
			{
				key: 'week-2',
				cells: [
					{ key: 'w2-1', label: '24', variant: 'prediction' },
					{ key: 'w2-2', label: '25', variant: 'prediction' },
					{ key: 'w2-3', label: '26', variant: 'selectedDetail' },
					{ key: 'w2-4', label: '27', variant: 'default' },
					{ key: 'w2-5', label: '28', variant: 'default' },
					{ key: 'w2-6', label: '29', variant: 'default' },
					{ key: 'w2-7', label: '30', variant: 'default' }
				]
			},
			{
				key: 'week-3',
				cells: [
					{ key: 'w3-1', label: '31', variant: 'today' },
					{ key: 'w3-2', label: '01', variant: 'futureMuted' },
					{ key: 'w3-3', label: '02', variant: 'futureMuted' },
					{ key: 'w3-4', label: '03', variant: 'futureMuted' },
					{ key: 'w3-5', label: '04', variant: 'prediction' },
					{ key: 'w3-6', label: '05', variant: 'prediction' },
					{ key: 'w3-7', label: '06', variant: 'prediction' }
				]
			}
		]
	},
	selectedDatePanel: createSelectedDatePanelData()
});

export function createCalendarGridAcceptancePage() {
	return {
		topBar: { ...CALENDAR_GRID_ACCEPTANCE_PAGE.topBar },
		heroCard: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.heroCard,
			currentRange: { ...CALENDAR_GRID_ACCEPTANCE_PAGE.heroCard.currentRange },
			predictionRange: { ...CALENDAR_GRID_ACCEPTANCE_PAGE.heroCard.predictionRange }
		},
		headerNav: { ...CALENDAR_GRID_ACCEPTANCE_PAGE.headerNav },
		jumpTabs: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.jumpTabs,
			items: CALENDAR_GRID_ACCEPTANCE_PAGE.jumpTabs.items.map((item) => ({ ...item }))
		},
		viewModeControl: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.viewModeControl,
			options: CALENDAR_GRID_ACCEPTANCE_PAGE.viewModeControl.options.map((item) => ({ ...item }))
		},
		calendarCard: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.calendarCard,
			weekdayLabels: [...CALENDAR_GRID_ACCEPTANCE_PAGE.calendarCard.weekdayLabels],
			weeks: CALENDAR_GRID_ACCEPTANCE_PAGE.calendarCard.weeks.map((week) => ({
				...week,
				cells: week.cells.map((cell) => ({ ...cell }))
			}))
		},
		legend: createCalendarLegendItems(),
		selectedDatePanel: createSelectedDatePanelData()
	};
}
