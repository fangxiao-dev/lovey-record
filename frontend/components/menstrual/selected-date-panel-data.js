const SELECTED_DATE_PANEL = Object.freeze({
	title: '3 月 22 日',
	badge: '今日',
	initialPeriodMarked: true,
	initialEditorOpen: false,
	summaryItems: [
		{ key: 'flow', label: '流量', value: '中', icon: 'water_drop', tone: 'flow' },
		{ key: 'pain', label: '疼痛', value: '轻微', icon: 'favorite', tone: 'pain' },
		{ key: 'color', label: '颜色', value: '标准', icon: 'palette', tone: 'color' }
	],
	attributeRows: [
		{
			key: 'flow',
			label: '流量',
			icon: 'water_drop',
			options: [
				{ key: 'spotting', label: '极少', tone: 'flow-spotting' },
				{ key: 'light', label: '少', tone: 'flow-light' },
				{ key: 'normal', label: '正常', tone: 'flow-normal', selected: true },
				{ key: 'heavy', label: '多', tone: 'flow-heavy' },
				{ key: 'veryHeavy', label: '极多', tone: 'flow-very-heavy' }
			]
		},
		{
			key: 'pain',
			label: '疼痛',
			icon: 'favorite',
			options: [
				{ key: 'none', label: '无', tone: 'pain-none' },
				{ key: 'light', label: '轻', tone: 'pain-light', selected: true },
				{ key: 'normal', label: '正常', tone: 'pain-normal' },
				{ key: 'strong', label: '强', tone: 'pain-strong' },
				{ key: 'veryStrong', label: '极强', tone: 'pain-very-strong' }
			]
		},
		{
			key: 'color',
			label: '颜色',
			icon: 'palette',
			options: [
				{ key: 'veryLight', label: '极浅', tone: 'color-very-light' },
				{ key: 'light', label: '浅', tone: 'color-light' },
				{ key: 'normal', label: '正常', tone: 'color-normal' },
				{ key: 'deep', label: '深', tone: 'color-deep', selected: true },
				{ key: 'veryDeep', label: '极深', tone: 'color-very-deep' }
			]
		}
	]
});

export function createSelectedDatePanelData() {
	return {
		...SELECTED_DATE_PANEL,
		summaryItems: SELECTED_DATE_PANEL.summaryItems.map((item) => ({ ...item })),
		attributeRows: SELECTED_DATE_PANEL.attributeRows.map((row) => ({
			...row,
			options: row.options.map((option) => ({ ...option }))
		}))
	};
}
