const CALENDAR_GRID_SHOWCASE = Object.freeze({
	title: 'CalendarGrid',
	weekdayLabels: ['一', '二', '三', '四', '五', '六', '日'],
	weeks: [
		{
			key: 'week-1',
			cells: [
				{ key: 'w1-1', label: '22', variant: 'default' },
				{ key: 'w1-2', label: '23', variant: 'detail' },
				{ key: 'w1-3', label: '24', variant: 'prediction' },
				{ key: 'w1-4', label: '25', variant: 'period' },
				{ key: 'w1-5', label: '26', variant: 'default' },
				{ key: 'w1-6', label: '27', variant: 'detail' },
				{ key: 'w1-7', label: '28', variant: 'today' }
			]
		},
		{
			key: 'week-2',
			cells: [
				{ key: 'w2-1', label: '29', variant: 'futureMuted' },
				{ key: 'w2-2', label: '30', variant: 'futureMuted' },
				{ key: 'w2-3', label: '31', variant: 'futureMuted' },
				{ key: 'w2-4', label: '1', variant: 'futureMuted' },
				{ key: 'w2-5', label: '2', variant: 'futureMuted' },
				{ key: 'w2-6', label: '3', variant: 'futureMuted' },
				{ key: 'w2-7', label: '4', variant: 'futureMuted' }
			]
		}
	]
});

export function createCalendarGridShowcase() {
	return {
		...CALENDAR_GRID_SHOWCASE,
		weeks: CALENDAR_GRID_SHOWCASE.weeks.map((week) => ({
			...week,
			cells: week.cells.map((cell) => ({ ...cell }))
		}))
	};
}
