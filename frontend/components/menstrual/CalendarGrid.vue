<template>
	<view class="calendar-grid" :class="rootClasses">
		<view class="calendar-grid__weekday-row" aria-hidden="true">
			<text
				v-for="label in resolvedWeekdayLabels"
				:key="label"
				class="calendar-grid__weekday"
			>
				{{ label }}
			</text>
		</view>

		<view
			v-for="(week, weekIndex) in resolvedWeeks"
			:key="week.key || weekIndex"
			class="calendar-grid__week"
			:class="{ 'calendar-grid__week--divider': weekIndex > 0 }"
		>
			<view v-if="weekIndex > 0" class="calendar-grid__divider" aria-hidden="true"></view>
			<view class="calendar-grid__cells">
				<view
					v-for="cell in week.cells"
					:key="cell.key || cell.label"
					class="calendar-grid__cell"
				>
					<DateCell :label="cell.label" :variant="cell.variant" />
					<text v-if="cell.caption" class="calendar-grid__cell-caption">
						{{ cell.caption }}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import DateCell from './DateCell.vue';

	const DEFAULT_WEEKDAY_LABELS = Object.freeze(['一', '二', '三', '四', '五', '六', '日']);

	export default {
		name: 'CalendarGrid',
		components: {
			DateCell
		},
		props: {
			weeks: {
				type: Array,
				required: true
			},
			weekdayLabels: {
				type: Array,
				default() {
					return DEFAULT_WEEKDAY_LABELS;
				}
			}
		},
		computed: {
			resolvedWeeks() {
				return this.weeks.map((week) => ({
					key: week.key,
					cells: Array.isArray(week.cells) ? week.cells : []
				}));
			},
			resolvedWeekdayLabels() {
				return this.weekdayLabels.length ? this.weekdayLabels : DEFAULT_WEEKDAY_LABELS;
			},
			rootClasses() {
				return [];
			}
		}
	};
</script>

<style lang="scss">
	.calendar-grid {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 22rpx;
	}

	.calendar-grid__weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: 12rpx;
	}

	.calendar-grid__weekday {
		text-align: center;
		font-family: $font-family-body;
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}

	.calendar-grid__week {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.calendar-grid__divider {
		height: 2rpx;
		background: $calendar-week-divider;
		opacity: 0.9;
	}

	.calendar-grid__cells {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: 12rpx;
		row-gap: 12rpx;
	}

	.calendar-grid__cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 8rpx;
		min-height: 112rpx;
		min-width: 0;
		overflow: visible;
	}

	.calendar-grid__cell-caption {
		display: block;
		font-family: $font-family-body;
		font-size: 20rpx;
		line-height: 1;
		color: $text-muted;
		text-align: center;
	}
</style>
