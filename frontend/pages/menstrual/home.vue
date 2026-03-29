<template>
	<view class="menstrual-home u-page-shell">
		<view v-if="page" class="menstrual-home__topbar">
			<text class="menstrual-home__topbar-title">{{ page.topBar.title }}</text>
			<view class="menstrual-home__topbar-status">
				<text class="menstrual-home__topbar-status-label">{{ page.topBar.statusLabel }}</text>
			</view>
		</view>

		<view v-if="page" class="menstrual-home__hero">
			<text v-if="page.heroCard.eyebrow" class="menstrual-home__hero-eyebrow">{{ page.heroCard.eyebrow }}</text>
			<text class="menstrual-home__hero-title">{{ page.heroCard.title }}</text>
			<text v-if="page.heroCard.copy" class="menstrual-home__hero-copy">{{ page.heroCard.copy }}</text>
			<text v-if="loadError" class="menstrual-home__hero-meta">联调刷新失败：{{ loadError }}</text>
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

		<view v-if="page" class="menstrual-home__content">
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
			<view class="menstrual-home__jump-row">
				<JumpTabs :items="page.jumpTabs.items" :value="page.jumpTabs.value" @jump="handleJump" />
				<view v-if="panelMode === 'batch'" class="menstrual-home__batch-actions">
					<view class="menstrual-home__batch-btn menstrual-home__batch-btn--save" @tap="applyBatchAction">
						<text class="menstrual-home__batch-btn-label menstrual-home__batch-btn-label--save">保存</text>
					</view>
					<view class="menstrual-home__batch-btn menstrual-home__batch-btn--cancel" @tap="cancelBatchMode">
						<text class="menstrual-home__batch-btn-label">取消</text>
					</view>
				</view>
			</view>
			<CalendarGrid
				:weeks="page.calendarCard.weeks"
				:weekday-labels="page.calendarCard.weekdayLabels"
				:interactive="page.viewModeControl.value === 'three-week'"
				:selected-keys="selectedBatchKeys"
				@cell-tap="handleCellTap"
				@batch-start="handleBatchStart"
				@batch-extend="handleBatchExtend"
				@batch-end="handleBatchEnd"
			/>
			<CalendarLegend :items="page.legend" />
			<SelectedDatePanel
				v-if="panelMode !== 'batch'"
				:title="page.selectedDatePanel.title"
				:badge="page.selectedDatePanel.badge"
				:summary-items="page.selectedDatePanel.summaryItems"
				:attribute-rows="page.selectedDatePanel.attributeRows"
				:note="page.selectedDatePanel.note"
				:initial-period-marked="page.selectedDatePanel.initialPeriodMarked"
				:initial-editor-open="page.selectedDatePanel.initialEditorOpen"
				@toggle-attribute-option="handleToggleAttributeOption"
				@clear-attributes="handleClearAttributes"
				@toggle-period="handleTogglePeriod"
				@note-change="handleNoteChange"
			/>
		</view>

		<view v-else class="menstrual-home__state-card">
			<text class="menstrual-home__state-title">{{ loadError ? '联调加载失败' : '正在连接联调环境' }}</text>
			<text class="menstrual-home__state-copy">
				{{ loadError || '正在读取 getModuleHomeView、getCalendarWindow、getDayRecordDetail。' }}
			</text>
			<view v-if="loadError" class="menstrual-home__state-action" @tap="retryInitialLoad">
				<text class="menstrual-home__state-action-label">重新加载</text>
			</view>
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
		applySelectedDateNoteToPageModel,
		applyToggleAttributeOptionToPageModel,
		applyTogglePeriodToPageModel,
		resolveJumpTargetDate,
		shiftFocusDate
	} from '../../components/menstrual/home-contract-adapter.js';
	import {
		DEFAULT_MENSTRUAL_HOME_CONTEXT,
		loadMenstrualHomePageModel
	} from '../../services/menstrual/home-contract-service.js';
	import {
		persistBatchPeriodRange,
		persistSelectedDateNote,
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
				page: null,
				loadError: '',
				activeDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				focusDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				viewMode: 'three-week',
				isMutating: false,
				panelMode: 'single-day',
				batchStartKey: null,
				batchEndKey: null,
				batchHoveredKey: null,
				batchSelectedKeysState: [],
				contractContext: { ...DEFAULT_MENSTRUAL_HOME_CONTEXT },
				rawContracts: null
			};
		},
		computed: {
			allCalendarCells() {
				return this.page?.calendarCard?.weeks?.flatMap((week) => week.cells) || [];
			},
			selectedBatchKeys() {
				if (this.panelMode !== 'batch') return [];
				return this.batchSelectedKeysState;
			}
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
			this.retryInitialLoad();
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
				this.loadError = result.error || '';
				this.rawContracts = result.raw;
				this.activeDate = result.raw?.dayDetail?.dayRecord?.date || activeDate || this.activeDate;
				this.focusDate = result.raw?.focusDate || nextFocusDate;
				this.viewMode = result.raw?.viewMode || nextViewMode;
			},
			async retryInitialLoad() {
				this.loadError = '';
				try {
					await this.refreshFromContracts(this.activeDate, {
						fallbackOnError: false,
						focusDate: this.focusDate,
						viewMode: this.viewMode
					});
				} catch (error) {
					this.page = null;
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				}
			},
			runLiveRefresh(activeDate = this.activeDate, options = {}) {
				return this.refreshFromContracts(activeDate, {
					...options,
					fallbackOnError: false
				}).catch((error) => {
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				});
			},
			handleCellTap(cell) {
				if (!cell?.isoDate) return;
				this.panelMode = 'single-day';
				this.runLiveRefresh(cell.isoDate);
			},
			handleViewModeChange(nextMode) {
				if (!nextMode || nextMode === this.viewMode) return;
				this.panelMode = 'single-day';
				this.runLiveRefresh(this.activeDate, {
					viewMode: nextMode,
					focusDate: this.focusDate
				});
			},
			handleHeaderPrev() {
				this.panelMode = 'single-day';
				this.runLiveRefresh(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: shiftFocusDate(this.focusDate, this.viewMode, -1)
				});
			},
			handleHeaderNext() {
				this.panelMode = 'single-day';
				this.runLiveRefresh(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: shiftFocusDate(this.focusDate, this.viewMode, 1)
				});
			},
			handleJump(jumpKey) {
				const targetDate = resolveJumpTargetDate(this.rawContracts?.homeView, jumpKey, this.contractContext.today);
				if (!targetDate) return;
				this.panelMode = 'single-day';
				this.runLiveRefresh(this.activeDate, {
					viewMode: this.viewMode,
					focusDate: targetDate
				});
			},
			async runOptimisticMutation(nextPage, command) {
				if (this.isMutating) return;
				const previousPage = this.page;
				this.page = nextPage;
				this.loadError = '';
				this.isMutating = true;

				try {
					await command();
				} catch (error) {
					this.page = previousPage;
					this.loadError = error instanceof Error ? error.message : 'Command failed';
					this.isMutating = false;
					return;
				}

				try {
					await this.refreshFromContracts(this.activeDate, {
						focusDate: this.focusDate,
						viewMode: this.viewMode
					});
				} catch (error) {
					this.page = nextPage;
					this.loadError = error instanceof Error ? `写入成功，但刷新失败：${error.message}` : '写入成功，但刷新失败';
				} finally {
					this.isMutating = false;
				}
			},
			async runCommand(command) {
				if (this.isMutating) return;
				this.loadError = '';
				this.isMutating = true;

				try {
					await command();
					await this.refreshFromContracts(this.activeDate, {
						focusDate: this.focusDate,
						viewMode: this.viewMode
					});
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : 'Command failed';
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
			},
			handleNoteChange(note) {
				if (note === this.page?.selectedDatePanel?.note) return;
				const nextPage = applySelectedDateNoteToPageModel(this.page, note);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDateNote({
					context: this.contractContext,
					activeDate: this.activeDate,
					note
				}));
			},
			handleBatchStart(cell) {
				if (!cell?.key) return;
				this.panelMode = 'batch';
				this.batchStartKey = cell.key;
				this.batchEndKey = cell.key;
				this.batchHoveredKey = cell.key;
				this.batchSelectedKeysState = [];
				this.toggleBatchSelectionKey(cell.key);
				if (cell.isoDate) {
					this.activeDate = cell.isoDate;
				}
			},
			handleBatchExtend(cell) {
				if (!cell?.key) return;
				if (cell.key === this.batchHoveredKey) return;
				this.batchEndKey = cell.key;
				this.batchHoveredKey = cell.key;
				this.toggleBatchSelectionKey(cell.key);
				if (cell.isoDate) {
					this.activeDate = cell.isoDate;
				}
			},
			handleBatchEnd() {
				if (!this.selectedBatchKeys.length) {
					this.cancelBatchMode();
				}
			},
			cancelBatchMode() {
				this.panelMode = 'single-day';
				this.batchStartKey = null;
				this.batchEndKey = null;
				this.batchHoveredKey = null;
				this.batchSelectedKeysState = [];
			},
			applyBatchAction() {
				if (!this.selectedBatchKeys.length) return;
				const ranges = this.buildBatchRanges(this.selectedBatchKeys);

				return this.runCommand(async () => {
					for (const range of ranges) {
						await persistBatchPeriodRange({
							context: this.contractContext,
							action: 'set-period',
							startDate: range.startDate,
							endDate: range.endDate
						});
					}
					this.cancelBatchMode();
				});
			},
			toggleBatchSelectionKey(cellKey) {
				const nextKeys = new Set(this.batchSelectedKeysState);
				if (nextKeys.has(cellKey)) {
					nextKeys.delete(cellKey);
				} else {
					nextKeys.add(cellKey);
				}
				this.batchSelectedKeysState = this.allCalendarCells
					.filter((cell) => nextKeys.has(cell.key))
					.map((cell) => cell.key);
			},
			buildBatchRanges(selectedKeys) {
				const selectedKeySet = new Set(selectedKeys);
				const orderedSelectedCells = this.allCalendarCells.filter((cell) => selectedKeySet.has(cell.key) && cell.isoDate);
				const ranges = [];
				let currentRange = null;

				for (let index = 0; index < orderedSelectedCells.length; index += 1) {
					const cell = orderedSelectedCells[index];
					const previousCell = orderedSelectedCells[index - 1];
					const previousIndex = previousCell ? this.allCalendarCells.findIndex((item) => item.key === previousCell.key) : -1;
					const currentIndex = this.allCalendarCells.findIndex((item) => item.key === cell.key);
					const isContiguous = previousCell && currentIndex === previousIndex + 1;

					if (!currentRange || !isContiguous) {
						currentRange = {
							startDate: cell.isoDate,
							endDate: cell.isoDate
						};
						ranges.push(currentRange);
						continue;
					}

					currentRange.endDate = cell.isoDate;
				}

				return ranges;
			},
			formatBatchDateLabel(cellKey) {
				if (!cellKey) return '';
				const cell = this.allCalendarCells.find((item) => item.key === cellKey);
				if (!cell?.isoDate) return '';
				const parts = cell.isoDate.split('-');
				return parts.length === 3 ? `${parts[1]}/${parts[2]}` : cell.isoDate;
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
		color: #b55d51;
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

	.menstrual-home__jump-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12rpx;
	}

	.menstrual-home__batch-actions {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		flex-shrink: 0;
	}

	.menstrual-home__batch-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 56rpx;
		padding: 0 18rpx;
		border-radius: 20rpx;
	}

	.menstrual-home__batch-btn--save {
		background: $accent-period;
	}

	.menstrual-home__batch-btn--cancel {
		background: $bg-subtle;
	}

	.menstrual-home__batch-btn-label {
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-secondary;
	}

	.menstrual-home__batch-btn-label--save {
		color: $accent-period-contrast;
	}

	.menstrual-home__state-card {
		display: flex;
		flex-direction: column;
		gap: 14rpx;
		padding: 32rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.menstrual-home__state-title {
		font-size: 32rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.menstrual-home__state-copy {
		font-size: 22rpx;
		line-height: 1.6;
		color: $text-secondary;
	}

	.menstrual-home__state-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 72rpx;
		padding: 0 24rpx;
		border-radius: 24rpx;
		background: $accent-period;
		align-self: flex-start;
	}

	.menstrual-home__state-action-label {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $accent-period-contrast;
	}
</style>
