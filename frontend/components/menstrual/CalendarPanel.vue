<template>
	<view class="calendar-panel">
		<!-- Header: view-mode toggle + month nav -->
		<view class="calendar-panel__header">
			<SegmentedControl
				:options="viewModeOptions"
				:value="viewMode"
				@change="onViewModeChange"
			/>
			<HeaderNav
				:month-label="monthLabel"
				@prev="$emit('navigate', 'prev')"
				@next="$emit('navigate', 'next')"
			/>
		</view>

		<!-- Calendar grid -->
		<CalendarGrid
			:weeks="weeks"
			:weekday-labels="weekdayLabels"
			:interactive="viewMode === 'three-week'"
			:selected-keys="selectedKeys"
			@cell-tap="onCellTap"
			@batch-start="onBatchStart"
			@batch-extend="onBatchExtend"
			@batch-end="onBatchEnd"
		/>

		<!-- Jump shortcuts -->
		<JumpTabs :items="jumpTabItems" @jump="onJump" />

		<!-- Legend -->
		<CalendarLegend />

		<!-- Bottom panel: single-day edit or batch edit -->
		<SelectedDatePanel
			v-if="panelMode === 'single-day' && selectedDatePanel"
			:title="selectedDatePanel.title"
			:badge="selectedDatePanel.badge"
			:summary-items="selectedDatePanel.summaryItems"
			:attribute-rows="selectedDatePanel.attributeRows"
			@toggle-period="(v) => $emit('toggle-period', { date: activeCellKey, value: v })"
			@toggle-attribute-option="(p) => $emit('toggle-attribute-option', { date: activeCellKey, ...p })"
			@clear-attributes="$emit('clear-attributes', { date: activeCellKey })"
		/>

		<BatchEditPanel
			v-if="panelMode === 'batch'"
			:start-label="batchStartLabel"
			:end-label="batchEndLabel"
			:active-action="batchAction"
			@action-change="batchAction = $event"
			@cancel="exitBatchMode"
			@apply="onBatchApply"
		/>
	</view>
</template>

<script>
	import BatchEditPanel from './BatchEditPanel.vue';
	import CalendarGrid from './CalendarGrid.vue';
	import CalendarLegend from './CalendarLegend.vue';
	import HeaderNav from './HeaderNav.vue';
	import JumpTabs from './JumpTabs.vue';
	import SelectedDatePanel from './SelectedDatePanel.vue';
	import SegmentedControl from './SegmentedControl.vue';

	const VIEW_MODE_OPTIONS = Object.freeze([
		{ key: 'three-week', label: '3 周' },
		{ key: 'month', label: '月览' }
	]);

	const DEFAULT_WEEKDAY_LABELS = Object.freeze(['一', '二', '三', '四', '五', '六', '日']);

	export default {
		name: 'CalendarPanel',
		components: {
			BatchEditPanel,
			CalendarGrid,
			CalendarLegend,
			HeaderNav,
			JumpTabs,
			SelectedDatePanel,
			SegmentedControl
		},
		props: {
			/**
			 * Array of week objects. Each week: { key, cells[] }
			 * Each cell: { key, label, variant, selectable?, isoDate? }
			 */
			weeks: {
				type: Array,
				required: true
			},
			weekdayLabels: {
				type: Array,
				default() {
					return DEFAULT_WEEKDAY_LABELS;
				}
			},
			monthLabel: {
				type: String,
				required: true
			},
			viewMode: {
				type: String,
				default: 'three-week'
			},
			/** Set false to disable 本次 jump tab */
			hasPeriod: {
				type: Boolean,
				default: true
			},
			/** Set false to disable 下次预测 jump tab */
			hasPrediction: {
				type: Boolean,
				default: true
			},
			/**
			 * Data for SelectedDatePanel when a date is tapped.
			 * Shape: { title, badge, summaryItems, attributeRows }
			 */
			selectedDatePanel: {
				type: Object,
				default: null
			}
		},
		emits: [
			'navigate',
			'view-mode-change',
			'jump',
			'cell-tap',
			'toggle-period',
			'toggle-attribute-option',
			'clear-attributes',
			'batch-apply'
		],
		data() {
			return {
				/** 'single-day' | 'batch' */
				panelMode: 'single-day',
				activeCellKey: null,
				batchStartKey: null,
				batchEndKey: null,
				/** 'set-period' | 'clear-record' | null */
				batchAction: 'set-period'
			};
		},
		computed: {
			viewModeOptions() {
				return VIEW_MODE_OPTIONS;
			},

			jumpTabItems() {
				return [
					{ key: 'today', label: '今天', tone: 'outlined', disabled: false },
					{ key: 'current', label: '本次', tone: 'accent', disabled: !this.hasPeriod },
					{ key: 'prediction', label: '下次预测', tone: 'soft', disabled: !this.hasPrediction }
				];
			},

			allCells() {
				return this.weeks.flatMap((w) => w.cells);
			},

			selectedKeys() {
				if (this.panelMode !== 'batch') return [];
				const cells = this.allCells;
				const startIdx = cells.findIndex((c) => c.key === this.batchStartKey);
				const endIdx = cells.findIndex((c) => c.key === this.batchEndKey);
				if (startIdx === -1) return [];
				if (endIdx === -1) return [this.batchStartKey];
				const lo = Math.min(startIdx, endIdx);
				const hi = Math.max(startIdx, endIdx);
				return cells.slice(lo, hi + 1)
					.filter((c) => c.selectable !== false)
					.map((c) => c.key);
			},

			batchStartLabel() {
				const key = this.selectedKeys[0];
				return key ? this.cellDateLabel(key) : '';
			},

			batchEndLabel() {
				const key = this.selectedKeys[this.selectedKeys.length - 1];
				return key ? this.cellDateLabel(key) : '';
			}
		},
		methods: {
			onViewModeChange(mode) {
				this.$emit('view-mode-change', mode);
			},

			onJump(key) {
				this.$emit('jump', key);
			},

			onCellTap(cell) {
				this.panelMode = 'single-day';
				this.activeCellKey = cell.key;
				this.$emit('cell-tap', cell);
			},

			onBatchStart(cell) {
				this.panelMode = 'batch';
				this.batchStartKey = cell.key;
				this.batchEndKey = cell.key;
				this.batchAction = 'set-period';
			},

			onBatchExtend(cell) {
				this.batchEndKey = cell.key;
			},

			onBatchEnd() {
				// Drag finished — BatchEditPanel is already visible via panelMode === 'batch'
			},

			exitBatchMode() {
				this.panelMode = 'single-day';
				this.batchStartKey = null;
				this.batchEndKey = null;
				this.batchAction = 'set-period';
			},

			onBatchApply() {
				const keys = this.selectedKeys;
				this.$emit('batch-apply', {
					action: this.batchAction,
					selectedKeys: keys,
					startIsoDate: this.cellIsoDate(keys[0]),
					endIsoDate: this.cellIsoDate(keys[keys.length - 1])
				});
				this.exitBatchMode();
			},

			cellDateLabel(key) {
				const cell = this.allCells.find((c) => c.key === key);
				if (!cell) return '';
				if (cell.isoDate) {
					// '2026-03-18' → '03/18'
					const parts = cell.isoDate.split('-');
					return parts.length === 3 ? `${parts[1]}/${parts[2]}` : cell.label;
				}
				return String(cell.label);
			},

			cellIsoDate(key) {
				if (!key) return null;
				const cell = this.allCells.find((c) => c.key === key);
				return cell ? (cell.isoDate || null) : null;
			}
		}
	};
</script>

<style lang="scss">
	.calendar-panel {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.calendar-panel__header {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
</style>
