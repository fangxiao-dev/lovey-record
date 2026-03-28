<template>
	<view class="calendar-grid-showcase u-page-shell">
		<view class="calendar-grid-showcase__topbar">
			<text class="calendar-grid-showcase__topbar-title">{{ page.topBar.title }}</text>
			<view class="calendar-grid-showcase__topbar-status">
				<text class="calendar-grid-showcase__topbar-status-label">{{ page.topBar.statusLabel }}</text>
			</view>
		</view>

		<view class="calendar-grid-showcase__hero">
			<text v-if="page.heroCard.eyebrow" class="calendar-grid-showcase__hero-eyebrow">{{ page.heroCard.eyebrow }}</text>
			<text class="calendar-grid-showcase__hero-title">{{ page.heroCard.title }}</text>
			<text v-if="page.heroCard.copy" class="calendar-grid-showcase__hero-copy">{{ page.heroCard.copy }}</text>
			<view class="calendar-grid-showcase__hero-ranges">
				<view class="calendar-grid-showcase__hero-range">
					<text class="calendar-grid-showcase__hero-range-label">{{ page.heroCard.currentRange.label }}</text>
					<text class="calendar-grid-showcase__hero-range-value">{{ page.heroCard.currentRange.value }}</text>
				</view>
				<view class="calendar-grid-showcase__hero-range">
					<text class="calendar-grid-showcase__hero-range-label">{{ page.heroCard.predictionRange.label }}</text>
					<text class="calendar-grid-showcase__hero-range-value">{{ page.heroCard.predictionRange.value }}</text>
				</view>
			</view>
		</view>

		<view class="calendar-grid-showcase__content">
			<SegmentedControl
				:options="page.viewModeControl.options"
				:value="page.viewModeControl.value"
			/>
			<HeaderNav
				:month-label="page.headerNav.monthLabel"
				:leading-label="page.headerNav.leadingLabel"
				:trailing-label="page.headerNav.trailingLabel"
			/>
			<JumpTabs :items="page.jumpTabs.items" :value="page.jumpTabs.value" />
			<CalendarGrid
				:weeks="page.calendarCard.weeks"
				:weekday-labels="page.calendarCard.weekdayLabels"
			/>
			<CalendarLegend :items="page.legend" />
			<SelectedDatePanel
				:title="page.selectedDatePanel.title"
				:badge="page.selectedDatePanel.badge"
				:chips="page.selectedDatePanel.chips"
				:summary-items="page.selectedDatePanel.summaryItems"
				:attribute-rows="page.selectedDatePanel.attributeRows"
				:action-label="page.selectedDatePanel.actionLabel"
			/>
		</view>
	</view>
</template>

<script>
	import CalendarGrid from '../../components/menstrual/CalendarGrid.vue';
	import CalendarLegend from '../../components/menstrual/CalendarLegend.vue';
	import HeaderNav from '../../components/menstrual/HeaderNav.vue';
	import JumpTabs from '../../components/menstrual/JumpTabs.vue';
	import SelectedDatePanel from '../../components/menstrual/SelectedDatePanel.vue';
	import SegmentedControl from '../../components/menstrual/SegmentedControl.vue';
	import { createCalendarGridAcceptancePage } from '../../components/menstrual/calendar-grid-acceptance-page-data.js';

	export default {
		name: 'CalendarGridShowcasePage',
		components: {
			CalendarGrid,
			CalendarLegend,
			HeaderNav,
			JumpTabs,
			SelectedDatePanel,
			SegmentedControl
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
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding-top: 8rpx;
		padding-bottom: $space-12;
		background: #faf7f2;
	}

	.calendar-grid-showcase__topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16rpx;
	}

	.calendar-grid-showcase__topbar-title {
		font-size: 32rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.calendar-grid-showcase__topbar-status {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 40rpx;
		padding: 0 12rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.calendar-grid-showcase__topbar-status-label {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.calendar-grid-showcase__hero {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		padding: 14rpx 16rpx 16rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.calendar-grid-showcase__hero-eyebrow {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.calendar-grid-showcase__hero-title {
		font-size: 40rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.calendar-grid-showcase__hero-copy {
		font-size: 20rpx;
		line-height: 1.5;
		color: $text-secondary;
	}

	.calendar-grid-showcase__hero-ranges {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.calendar-grid-showcase__hero-range {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		padding: 10rpx 14rpx;
		border-radius: 24rpx;
		background: #faf7f2;
	}

	.calendar-grid-showcase__hero-range-label {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.calendar-grid-showcase__hero-range-value {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $accent-period;
	}

	.calendar-grid-showcase__content {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
</style>
