/**
 * Mock data for SelectedDatePanel showcase.
 * Covers all 5 composite states defined in function-day-recording.md.
 */

const FLOW_ROW = {
	key: 'flow',
	label: '流量',
	icon: 'water_drop',
	options: [
		{ key: 'flow-spotting', label: '极少', tone: 'flow-spotting', selected: false },
		{ key: 'flow-light',    label: '少',   tone: 'flow-light',    selected: false },
		{ key: 'flow-normal',   label: '正常', tone: 'flow-normal',   selected: false },
		{ key: 'flow-heavy',    label: '多',   tone: 'flow-heavy',    selected: false },
		{ key: 'flow-very-heavy', label: '极多', tone: 'flow-very-heavy', selected: false }
	]
};

const PAIN_ROW = {
	key: 'pain',
	label: '疼痛',
	icon: 'favorite',
	options: [
		{ key: 'pain-none',        label: '无',   tone: 'pain-none',        selected: false },
		{ key: 'pain-light',       label: '轻',   tone: 'pain-light',       selected: false },
		{ key: 'pain-normal',      label: '正常', tone: 'pain-normal',      selected: false },
		{ key: 'pain-strong',      label: '强',   tone: 'pain-strong',      selected: false },
		{ key: 'pain-very-strong', label: '极强', tone: 'pain-very-strong', selected: false }
	]
};

const COLOR_ROW = {
	key: 'color',
	label: '颜色',
	icon: 'palette',
	options: [
		{ key: 'color-very-light', label: '极浅', tone: 'color-very-light', selected: false },
		{ key: 'color-light',      label: '浅',   tone: 'color-light',      selected: false },
		{ key: 'color-normal',     label: '正常', tone: 'color-normal',     selected: false },
		{ key: 'color-deep',       label: '深',   tone: 'color-deep',       selected: false },
		{ key: 'color-very-deep',  label: '极深', tone: 'color-very-deep',  selected: false }
	]
};

function withSelection(row, selectedKey) {
	return {
		...row,
		options: row.options.map(o => ({ ...o, selected: o.key === selectedKey }))
	};
}

/**
 * State 1 — Default (no data, grid collapsed)
 * Badge: 点击记录
 * Chips: 经期 (inactive), + 记录详情
 * Summary bar: hidden
 * Grid: hidden
 * Clear button: hidden
 */
export const state1 = {
	label: 'State 1 — 无数据',
	title: '3 月 26 日',
	badge: '点击记录',
	isPeriodMarked: false,
	summaryItems: [],
	attributeRows: [FLOW_ROW, PAIN_ROW, COLOR_ROW]
};

/**
 * State 2 — Period only (grid collapsed)
 * Badge: 已记录
 * Chips: 经期 (active), + 记录详情
 * Summary bar: hidden
 * Grid: hidden
 * Clear button: hidden
 */
export const state2 = {
	label: 'State 2 — 仅标记经期',
	title: '3 月 26 日',
	badge: '已记录',
	isPeriodMarked: true,
	summaryItems: [],
	attributeRows: [FLOW_ROW, PAIN_ROW, COLOR_ROW]
};

/**
 * State 3 — Attributes recorded, grid collapsed
 * Badge: 已记录
 * Chips: 经期 (active), + 记录详情
 * Summary bar: visible (流量正常, 疼痛轻)
 * Grid: hidden
 * Clear button: hidden (grid is collapsed)
 */
export const state3 = {
	label: 'State 3 — 有属性，收起',
	title: '3 月 26 日',
	badge: '已记录',
	isPeriodMarked: true,
	summaryItems: [
		{ key: 'flow', label: '流量', icon: 'water_drop', tone: 'flow-normal', value: '正常' },
		{ key: 'pain', label: '疼痛', icon: 'favorite',   tone: 'pain-light',  value: '轻' }
	],
	attributeRows: [
		withSelection(FLOW_ROW, 'flow-normal'),
		withSelection(PAIN_ROW, 'pain-light'),
		COLOR_ROW
	]
};

/**
 * State 4 — Grid expanded, attributes selected
 * Badge: 已记录
 * Chips: 经期 (active), ↑ 收起
 * Summary bar: visible
 * Grid: visible
 * Clear button: visible
 */
export const state4 = {
	label: 'State 4 — 展开 + 已选属性',
	title: '3 月 26 日',
	badge: '已记录',
	isPeriodMarked: true,
	isEditorOpen: true,
	summaryItems: [
		{ key: 'flow', label: '流量', icon: 'water_drop', tone: 'flow-normal', value: '正常' },
		{ key: 'pain', label: '疼痛', icon: 'favorite',   tone: 'pain-light',  value: '轻' }
	],
	attributeRows: [
		withSelection(FLOW_ROW, 'flow-normal'),
		withSelection(PAIN_ROW, 'pain-light'),
		COLOR_ROW
	]
};

/**
 * State 5 — Grid expanded, no attributes selected yet
 * Badge: 点击记录
 * Chips: 经期 (inactive), ↑ 收起
 * Summary bar: hidden
 * Grid: visible
 * Clear button: hidden
 */
export const state5 = {
	label: 'State 5 — 展开，无属性',
	title: '3 月 26 日',
	badge: '点击记录',
	isPeriodMarked: false,
	isEditorOpen: true,
	summaryItems: [],
	attributeRows: [FLOW_ROW, PAIN_ROW, COLOR_ROW]
};

export const allStates = [state1, state2, state3, state4, state5];
