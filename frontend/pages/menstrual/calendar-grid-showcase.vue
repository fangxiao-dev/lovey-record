<template>
	<view class="calendar-grid-showcase u-page-shell">
		<view class="calendar-grid-showcase__card ui-card u-page-section">
			<text class="calendar-grid-showcase__title u-text-title-lg">{{ board.title }}</text>
			<text class="calendar-grid-showcase__copy u-text-body-secondary">
				CalendarGrid 先负责真实周历结构：周标题、周分割线、DateCell 组合，以及每个格子的状态标识。
			</text>
			<CalendarGrid
				:weeks="board.weeks"
				:weekday-labels="board.weekdayLabels"
			/>
		</view>

		<view class="calendar-grid-showcase__samples ui-card u-page-section">
			<text class="calendar-grid-showcase__title u-text-title-sm">Selection Samples</text>
			<text class="calendar-grid-showcase__copy u-text-body-secondary">
				下面这组只负责展示 selected 派生态，方便核对高对比填充、today 外环和 special 眼睛标识。
			</text>
			<view class="calendar-grid-showcase__sample-row">
				<view
					v-for="item in sampleCells"
					:key="item.key"
					class="calendar-grid-showcase__sample-cell"
				>
					<DateCell :label="item.label" :variant="item.variant" />
					<text class="calendar-grid-showcase__sample-caption">{{ item.caption }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import CalendarGrid from '../../components/menstrual/CalendarGrid.vue';
	import DateCell from '../../components/menstrual/DateCell.vue';
	import { createCalendarGridShowcase } from '../../components/menstrual/calendar-grid-showcase-data.js';

	export default {
		name: 'CalendarGridShowcasePage',
		components: {
			CalendarGrid,
			DateCell
		},
		data() {
			return {
				board: createCalendarGridShowcase(),
				sampleCells: [
					{ key: 'selected', label: '26', variant: 'selected', caption: 'selected' },
					{ key: 'selected-special', label: '26', variant: 'selectedSpecial', caption: 'selectedSpecial' },
					{ key: 'selected-prediction', label: '26', variant: 'selectedPrediction', caption: 'selectedPrediction' },
					{ key: 'selected-today', label: '26', variant: 'selectedTodaySpecial', caption: 'selectedTodaySpecial' },
					{ key: 'selected-period', label: '26', variant: 'selectedPeriodSpecial', caption: 'selectedPeriodSpecial' }
				]
			};
		}
	};
</script>

<style lang="scss">
	.calendar-grid-showcase {
		padding-bottom: $space-12;
		background: $bg-card;
	}

	.calendar-grid-showcase__card {
		display: flex;
		flex-direction: column;
		gap: $space-4;
		background: $bg-base;
	}

	.calendar-grid-showcase__samples {
		display: flex;
		flex-direction: column;
		gap: $space-4;
		background: $bg-base;
	}

	.calendar-grid-showcase__copy {
		display: block;
	}

	.calendar-grid-showcase__sample-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(112rpx, 1fr));
		column-gap: $space-5;
		row-gap: $space-5;
	}

	.calendar-grid-showcase__sample-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $space-2;
	}

	.calendar-grid-showcase__sample-cell :deep(.date-cell) {
		max-width: 116rpx;
	}

	.calendar-grid-showcase__sample-caption {
		display: block;
		max-width: 100%;
		font-size: 16rpx;
		line-height: 1.2;
		color: $text-muted;
		text-align: center;
		word-break: break-all;
	}
</style>
