<template>
	<view class="menstrual-home u-page-shell">
		<view class="menstrual-home__topbar">
			<text class="menstrual-home__topbar-title">{{ page.topBar.title }}</text>
			<view class="menstrual-home__topbar-status">
				<text class="menstrual-home__topbar-status-label">{{ page.topBar.statusLabel }}</text>
			</view>
		</view>

		<view class="menstrual-home__hero">
			<text v-if="page.heroCard.eyebrow" class="menstrual-home__hero-eyebrow">{{ page.heroCard.eyebrow }}</text>
			<text class="menstrual-home__hero-title">{{ page.heroCard.title }}</text>
			<text v-if="page.heroCard.copy" class="menstrual-home__hero-copy">{{ page.heroCard.copy }}</text>
			<text v-if="source === 'fallback'" class="menstrual-home__hero-meta">当前使用联调样例数据</text>
			<text v-if="loadError" class="menstrual-home__hero-meta">请求失败，已回退：{{ loadError }}</text>
			<view class="menstrual-home__hero-ranges">
				<view class="menstrual-home__hero-range">
					<text class="menstrual-home__hero-range-label">{{ page.heroCard.currentRange.label }}</text>
					<text class="menstrual-home__hero-range-value">{{ page.heroCard.currentRange.value }}</text>
				</view>
				<view class="menstrual-home__hero-range">
					<text class="menstrual-home__hero-range-label">{{ page.heroCard.predictionRange.label }}</text>
					<text class="menstrual-home__hero-range-value">{{ page.heroCard.predictionRange.value }}</text>
				</view>
			</view>
		</view>

		<view class="menstrual-home__content">
			<SegmentedControl
				:options="page.viewModeControl.options"
				:value="page.viewModeControl.value"
				@change="handleViewModeChange"
			/>
			<HeaderNav
				:month-label="page.headerNav.monthLabel"
				:leading-label="page.headerNav.leadingLabel"
				:trailing-label="page.headerNav.trailingLabel"
				@prev="handleHeaderPrev"
				@next="handleHeaderNext"
			/>
			<JumpTabs :items="page.jumpTabs.items" :value="page.jumpTabs.value" @jump="handleJump" />
			<CalendarGrid
				:weeks="page.calendarCard.weeks"
				:weekday-labels="page.calendarCard.weekdayLabels"
				:interactive="page.viewModeControl.value === 'three-week'"
				@cell-tap="handleCellTap"
			/>
			<CalendarLegend :items="page.legend" />
			<SelectedDatePanel
				:title="page.selectedDatePanel.title"
				:badge="page.selectedDatePanel.badge"
				:summary-items="page.selectedDatePanel.summaryItems"
				:attribute-rows="page.selectedDatePanel.attributeRows"
				:initial-period-marked="page.selectedDatePanel.initialPeriodMarked"
				:initial-editor-open="page.selectedDatePanel.initialEditorOpen"
				@toggle-attribute-option="handleToggleAttributeOption"
				@clear-attributes="handleClearAttributes"
				@toggle-period="handleTogglePeriod"
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
	import {
		applyClearAttributesToPageModel,
		applyToggleAttributeOptionToPageModel,
		applyTogglePeriodToPageModel,
		resolveJumpTargetDate,
		shiftFocusDate
	} from '../../components/menstrual/home-contract-adapter.js';
	import { createCalendarGridAcceptancePage } from '../../components/menstrual/calendar-grid-acceptance-page-data.js';
	import {
		DEFAULT_MENSTRUAL_HOME_CONTEXT,
		loadMenstrualHomePageModel
	} from '../../services/menstrual/home-contract-service.js';
	import {
		persistSelectedDateDetails,
		persistSelectedDatePeriodState
	} from '../../services/menstrual/home-command-service.js';

	export default {
		name: 'MenstrualHomePage',
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
				page: createCalendarGridAcceptancePage(),
				source: 'fallback',
				loadError: '',
				activeDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				focusDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				viewMode: 'three-week',
				isMutating: false,
				contractContext: { ...DEFAULT_MENSTRUAL_HOME_CONTEXT },
				rawContracts: null
			};
		},
		onLoad(options) {
			this.contractContext = {
				...DEFAULT_MENSTRUAL_HOME_CONTEXT,
				apiBaseUrl: options.apiBaseUrl || DEFAULT_MENSTRUAL_HOME_CONTEXT.apiBaseUrl,
				openid: options.openid || DEFAULT_MENSTRUAL_HOME_CONTEXT.openid,
				moduleInstanceId: options.moduleInstanceId || DEFAULT_MENSTRUAL_HOME_CONTEXT.moduleInstanceId,
				profileId: options.profileId || DEFAULT_MENSTRUAL_HOME_CONTEXT.profileId,
				today: options.today || DEFAULT_MENSTRUAL_HOME_CONTEXT.today
			};
			this.refreshFromContracts();
		},
		methods: {
			async refreshFromContracts(activeDate, options = {}) {
				const nextViewMode = options.viewMode || this.viewMode;
				const nextFocusDate = options.focusDate || this.focusDate || activeDate || this.activeDate;
				const result = await loadMenstrualHomePageModel({
					...this.contractContext,
					activeDate,
					focusDate: nextFocusDate,
					viewMode: nextViewMode,
					fallbackOnError: options.fallbackOnError
				});
				this.page = result.page;
				this.source = result.source;
				this.loadError = result.error || '';
				this.rawContracts = result.raw;
				this.activeDate = result.raw?.dayDetail?.dayRecord?.date || activeDate || this.activeDate;
				this.focusDate = result.raw?.focusDate || nextFocusDate;
				this.viewMode = result.raw?.viewMode || nextViewMode;
			},
			handleCellTap(cell) {
				if (!cell?.isoDate) return;
				this.refreshFromContracts(cell.isoDate);
			},
			handleViewModeChange(nextMode) {
				if (!nextMode || nextMode === this.viewMode) return;
				this.refreshFromContracts(this.activeDate, {
					viewMode: nextMode,
					focusDate: this.focusDate
				});
			},
			handleHeaderPrev() {
				this.refreshFromContracts(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: shiftFocusDate(this.focusDate, this.viewMode, -1)
				});
			},
			handleHeaderNext() {
				this.refreshFromContracts(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: shiftFocusDate(this.focusDate, this.viewMode, 1)
				});
			},
			handleJump(jumpKey) {
				const targetDate = resolveJumpTargetDate(this.rawContracts?.homeView, jumpKey, this.contractContext.today);
				if (!targetDate) return;
				this.refreshFromContracts(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: targetDate
				});
			},
			async runOptimisticMutation(nextPage, command) {
				if (this.isMutating) return;
				const previousPage = this.page;
				const previousSource = this.source;
				this.page = nextPage;
				this.loadError = '';
				this.isMutating = true;

				try {
					await command();
				} catch (error) {
					this.page = previousPage;
					this.source = previousSource;
					this.loadError = error instanceof Error ? error.message : 'Command failed';
					this.isMutating = false;
					return;
				}

				try {
					await this.refreshFromContracts(this.activeDate, {
						fallbackOnError: false,
						focusDate: this.focusDate,
						viewMode: this.viewMode
					});
				} catch (error) {
					this.page = nextPage;
					this.source = 'live';
					this.loadError = error instanceof Error ? `写入成功，但刷新失败：${error.message}` : '写入成功，但刷新失败';
				} finally {
					this.isMutating = false;
				}
			},
			handleToggleAttributeOption(payload) {
				const nextPage = applyToggleAttributeOptionToPageModel(this.page, payload);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
					context: this.contractContext,
					activeDate: this.activeDate,
					pageModel: nextPage
				}));
			},
			handleClearAttributes() {
				const nextPage = applyClearAttributesToPageModel(this.page);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
					context: this.contractContext,
					activeDate: this.activeDate,
					pageModel: nextPage
				}));
			},
			handleTogglePeriod(isPeriodMarked) {
				const nextPage = applyTogglePeriodToPageModel(this.page, isPeriodMarked);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDatePeriodState({
					context: this.contractContext,
					activeDate: this.activeDate,
					pageModel: nextPage,
					isPeriodMarked
				}));
			}
		}
	};
</script>

<style lang="scss">
	.menstrual-home {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding-top: 8rpx;
		padding-bottom: $space-12;
		background: #faf7f2;
	}

	.menstrual-home__topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16rpx;
	}

	.menstrual-home__topbar-title {
		font-size: 32rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.menstrual-home__topbar-status {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 40rpx;
		padding: 0 12rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.menstrual-home__topbar-status-label {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.menstrual-home__hero {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		padding: 14rpx 16rpx 16rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.menstrual-home__hero-eyebrow {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.menstrual-home__hero-title {
		font-size: 40rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.menstrual-home__hero-copy {
		font-size: 20rpx;
		line-height: 1.5;
		color: $text-secondary;
	}

	.menstrual-home__hero-meta {
		font-size: 18rpx;
		line-height: 1.4;
		color: $text-muted;
	}

	.menstrual-home__hero-ranges {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.menstrual-home__hero-range {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		padding: 10rpx 14rpx;
		border-radius: 24rpx;
		background: #faf7f2;
	}

	.menstrual-home__hero-range-label {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.menstrual-home__hero-range-value {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $accent-period;
	}

	.menstrual-home__content {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}
</style>
