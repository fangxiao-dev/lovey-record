const CALENDAR_LEGEND_ITEMS = Object.freeze([
	{ key: 'period', label: '本次经期', tone: 'period', marker: 'fill' },
	{ key: 'prediction', label: '经期预测', tone: 'prediction', marker: 'fill' },
	{ key: 'detail', label: '属性已记录', tone: 'detail', marker: 'eye' }
]);

export function createCalendarLegendItems() {
	return CALENDAR_LEGEND_ITEMS.map((item) => ({ ...item }));
}
