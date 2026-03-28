<template>
	<view class="calendar-grid-showcase u-page-shell">
		<view class="calendar-grid-showcase__card ui-card u-page-section">
			<view class="calendar-grid-showcase__card-head">
				<view class="calendar-grid-showcase__heading">
					<text class="calendar-grid-showcase__eyebrow">Calendar Acceptance</text>
					<text class="calendar-grid-showcase__title u-text-title-lg">{{ page.monthCard.title }}</text>
					<text class="calendar-grid-showcase__copy u-text-body-secondary">
						{{ page.monthCard.subtitle }}
					</text>
				</view>
				<view class="calendar-grid-showcase__summary-list">
					<view
						v-for="item in page.monthCard.summary"
						:key="item.key"
						class="calendar-grid-showcase__summary-item"
					>
						<text class="calendar-grid-showcase__summary-label">{{ item.label }}</text>
						<text class="calendar-grid-showcase__summary-value">{{ item.value }}</text>
					</view>
				</view>
			</view>
			<CalendarGrid
				:weeks="page.monthCard.weeks"
				:weekday-labels="page.monthCard.weekdayLabels"
			/>
			<CalendarLegend :items="page.monthCard.legend" />
		</view>

		<view class="calendar-grid-showcase__samples ui-card u-page-section">
			<text class="calendar-grid-showcase__title u-text-title-sm">{{ page.samples.title }}</text>
			<text class="calendar-grid-showcase__copy u-text-body-secondary">
				{{ page.samples.copy }}
			</text>
			<view class="calendar-grid-showcase__sample-row">
				<view
					v-for="item in page.samples.items"
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
	import CalendarLegend from '../../components/menstrual/CalendarLegend.vue';
	import DateCell from '../../components/menstrual/DateCell.vue';
	import { createCalendarGridAcceptancePage } from '../../components/menstrual/calendar-grid-acceptance-page-data.js';

	export default {
		name: 'CalendarGridShowcasePage',
		components: {
			CalendarGrid,
			CalendarLegend,
			DateCell
		},
		data() {
			return {
				page: createCalendarGridAcceptancePage()
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
		gap: $space-5;
		background: $bg-base;
	}

	.calendar-grid-showcase__samples {
		display: flex;
		flex-direction: column;
		gap: $space-4;
		background: $bg-base;
	}

	.calendar-grid-showcase__card-head {
		display: flex;
		flex-direction: column;
		gap: $space-4;
	}

	.calendar-grid-showcase__heading {
		display: flex;
		flex-direction: column;
		gap: $space-2;
	}

	.calendar-grid-showcase__eyebrow {
		font-size: 18rpx;
		line-height: 1;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: $text-muted;
	}

	.calendar-grid-showcase__copy {
		display: block;
	}

	.calendar-grid-showcase__summary-list {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		column-gap: $space-3;
		row-gap: $space-3;
		padding: $space-4;
		border-radius: $radius-card;
		background: $bg-card;
	}

	.calendar-grid-showcase__summary-item {
		display: flex;
		flex-direction: column;
		gap: $space-1;
		min-width: 0;
	}

	.calendar-grid-showcase__summary-label {
		font-size: 18rpx;
		line-height: 1.2;
		color: $text-muted;
	}

	.calendar-grid-showcase__summary-value {
		font-size: 22rpx;
		line-height: 1.25;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.calendar-grid-showcase__sample-row {
		display: flex;
		flex-wrap: wrap;
		column-gap: $space-5;
		row-gap: $space-5;
	}

	.calendar-grid-showcase__sample-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $space-2;
		width: 116rpx;
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
