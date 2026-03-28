<template>
	<view class="calendar-grid-showcase u-page-shell">
		<view class="calendar-grid-showcase__demo ui-card u-page-section">
			<HeaderNav
				:month-label="page.headerNav.monthLabel"
				:leading-label="page.headerNav.leadingLabel"
				:trailing-label="page.headerNav.trailingLabel"
			/>
			<JumpTabs :items="page.jumpTabs.items" :value="page.jumpTabs.value" />
			<SegmentedControl
				:options="page.viewModeControl.options"
				:value="page.viewModeControl.value"
			/>
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
		padding-bottom: $space-12;
		background: #f6f1ea;
	}

	.calendar-grid-showcase__demo {
		display: flex;
		flex-direction: column;
		gap: $space-5;
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		background: #ffffff;
	}

</style>
