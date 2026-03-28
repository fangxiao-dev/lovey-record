const CALENDAR_LEGEND_ITEMS = Object.freeze([
	{ key: 'period', label: '本次经期', tone: 'period', marker: 'fill' },
	{ key: 'prediction', label: '经期预测', tone: 'prediction', marker: 'fill' },
	{ key: 'special', label: '特殊标记', tone: 'special', marker: 'eye' }
]);

export function createCalendarLegendItems() {
	return CALENDAR_LEGEND_ITEMS.map((item) => ({ ...item }));
}
