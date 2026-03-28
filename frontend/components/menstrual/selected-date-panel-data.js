const SELECTED_DATE_PANEL = Object.freeze({
	title: '3 月 22 日',
	badge: '今日',
	chips: ['经期', '特殊标记'],
	summaryItems: [
		{ key: 'cycle-day', label: '周期天数', value: '第 4 天' },
		{ key: 'phase', label: '阶段', value: '本次经期' },
		{ key: 'note', label: '记录状态', value: '已添加特殊标记' }
	],
	actionLabel: '保存当天记录'
});

export function createSelectedDatePanelData() {
	return {
		...SELECTED_DATE_PANEL,
		chips: [...SELECTED_DATE_PANEL.chips],
		summaryItems: SELECTED_DATE_PANEL.summaryItems.map((item) => ({ ...item }))
	};
}
