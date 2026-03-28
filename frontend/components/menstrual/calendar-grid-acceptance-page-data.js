import { createCalendarLegendItems } from './calendar-legend-data.js';

const CALENDAR_GRID_ACCEPTANCE_PAGE = Object.freeze({
	monthCard: {
		title: '2026 年 3 月',
		subtitle: '记录中的这一个月',
		summary: [
			{ key: 'period', label: '本次经期', value: '03.24 - 03.28' },
			{ key: 'prediction', label: '下次预测', value: '04.19 - 04.23' },
			{ key: 'special', label: '特殊记录', value: '2 天' }
		],
		weekdayLabels: ['一', '二', '三', '四', '五', '六', '日'],
		weeks: [
			{
				key: 'week-1',
				cells: [
					{ key: 'w1-1', label: '23', variant: 'default' },
					{ key: 'w1-2', label: '24', variant: 'periodSpecial' },
					{ key: 'w1-3', label: '25', variant: 'period' },
					{ key: 'w1-4', label: '26', variant: 'period' },
					{ key: 'w1-5', label: '27', variant: 'periodSpecial' },
					{ key: 'w1-6', label: '28', variant: 'today' },
					{ key: 'w1-7', label: '29', variant: 'default' }
				]
			},
			{
				key: 'week-2',
				cells: [
					{ key: 'w2-1', label: '30', variant: 'default' },
					{ key: 'w2-2', label: '31', variant: 'default' },
					{ key: 'w2-3', label: '1', variant: 'futureMuted' },
					{ key: 'w2-4', label: '2', variant: 'futureMuted' },
					{ key: 'w2-5', label: '3', variant: 'futureMuted' },
					{ key: 'w2-6', label: '4', variant: 'futureMuted' },
					{ key: 'w2-7', label: '5', variant: 'futureMuted' }
				]
			},
			{
				key: 'week-3',
				cells: [
					{ key: 'w3-1', label: '6', variant: 'futureMuted' },
					{ key: 'w3-2', label: '7', variant: 'futureMuted' },
					{ key: 'w3-3', label: '8', variant: 'futureMuted' },
					{ key: 'w3-4', label: '9', variant: 'futureMuted' },
					{ key: 'w3-5', label: '10', variant: 'futureMuted' },
					{ key: 'w3-6', label: '11', variant: 'futureMuted' },
					{ key: 'w3-7', label: '12', variant: 'futureMuted' }
				]
			},
			{
				key: 'week-4',
				cells: [
					{ key: 'w4-1', label: '13', variant: 'futureMuted' },
					{ key: 'w4-2', label: '14', variant: 'futureMuted' },
					{ key: 'w4-3', label: '15', variant: 'futureMuted' },
					{ key: 'w4-4', label: '16', variant: 'futureMuted' },
					{ key: 'w4-5', label: '17', variant: 'prediction' },
					{ key: 'w4-6', label: '18', variant: 'prediction' },
					{ key: 'w4-7', label: '19', variant: 'predictionSpecial' }
				]
			},
			{
				key: 'week-5',
				cells: [
					{ key: 'w5-1', label: '20', variant: 'prediction' },
					{ key: 'w5-2', label: '21', variant: 'prediction' },
					{ key: 'w5-3', label: '22', variant: 'default' },
					{ key: 'w5-4', label: '23', variant: 'default' },
					{ key: 'w5-5', label: '24', variant: 'default' },
					{ key: 'w5-6', label: '25', variant: 'default' },
					{ key: 'w5-7', label: '26', variant: 'default' }
				]
			}
		]
	},
	samples: {
		title: '状态补充查看',
		copy: '只保留当前月卡片之外最容易混淆的组合态，避免验收页重新退回组件样例板。',
		items: [
			{ key: 'today-prediction', label: '26', variant: 'todayPrediction', caption: '今天 + 预测' },
			{
				key: 'selected-today-prediction',
				label: '26',
				variant: 'selectedTodayPrediction',
				caption: '选中 + 今天 + 预测'
			},
			{ key: 'today-period', label: '26', variant: 'todayPeriod', caption: '今天 + 经期' },
			{
				key: 'selected-today-period',
				label: '26',
				variant: 'selectedTodayPeriod',
				caption: '选中 + 今天 + 经期'
			}
		]
	}
});

export function createCalendarGridAcceptancePage() {
	return {
		monthCard: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.monthCard,
			summary: CALENDAR_GRID_ACCEPTANCE_PAGE.monthCard.summary.map((item) => ({ ...item })),
			legend: createCalendarLegendItems(),
			weeks: CALENDAR_GRID_ACCEPTANCE_PAGE.monthCard.weeks.map((week) => ({
				...week,
				cells: week.cells.map((cell) => ({ ...cell }))
			}))
		},
		samples: {
			...CALENDAR_GRID_ACCEPTANCE_PAGE.samples,
			items: CALENDAR_GRID_ACCEPTANCE_PAGE.samples.items.map((item) => ({ ...item }))
		}
	};
}
