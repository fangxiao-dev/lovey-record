<template>
	<view class="menstrual-home u-page-shell">
		<view v-if="page" class="menstrual-home__hero">
			<view class="menstrual-home__hero-header">
				<text class="menstrual-home__hero-label">{{ page.heroCard.label }}</text>
				<view class="menstrual-home__hero-sharing-chip">
					<text class="menstrual-home__hero-sharing-chip-label">{{ page.heroCard.sharingLabel }}</text>
				</view>
			</view>
			<view v-if="userRole === 'viewer'" class="menstrual-home__readonly-badge">
				<text class="menstrual-home__readonly-label">只读</text>
			</view>
			<button v-if="userRole === 'owner'" open-type="share" class="menstrual-home__share-btn">邀请</button>
			<!-- DEV ONLY: 生成 token 供手动测试 join 流程，上线前删除 -->
			<view v-if="userRole === 'owner'" class="menstrual-home__share-btn menstrual-home__share-btn--debug" @tap="handleDebugCopyToken">🔗</view>
			<view v-if="userRole === 'viewer'" class="menstrual-home__leave-btn" @tap="handleLeaveTap">
				<text>退出共享</text>
			</view>
			<view class="menstrual-home__hero-status-frame">
				<image class="menstrual-home__hero-status-icon" :src="page.heroCard.statusFrame.iconUrl" mode="aspectFit" />
				<text class="menstrual-home__hero-status-text">{{ page.heroCard.statusFrame.text }}</text>
			</view>
			<text v-if="loadError" class="menstrual-home__hero-meta">联调刷新失败：{{ loadError }}</text>
			<view class="menstrual-home__hero-info-row">
				<view class="menstrual-home__hero-info-frame">
					<text class="menstrual-home__hero-info-label">{{ page.heroCard.previousFrame.label }}</text>
					<text class="menstrual-home__hero-info-value">{{ page.heroCard.previousFrame.value }}</text>
				</view>
				<view class="menstrual-home__hero-info-frame menstrual-home__hero-info-frame--next">
					<text class="menstrual-home__hero-info-label">{{ page.heroCard.nextFrame.label }}</text>
					<text class="menstrual-home__hero-info-value">{{ page.heroCard.nextFrame.value }}</text>
				</view>
			</view>
		</view>

		<view v-if="page" class="menstrual-home__content">
			<SegmentedControl
				:options="page.viewModeControl.options"
				:value="page.viewModeControl.value"
				:busy="isBrowseBusy"
				@change="handleViewModeChange"
			/>
			<HeaderNav
				:month-label="page.headerNav.monthLabel"
				:leading-label="page.headerNav.leadingLabel"
				:trailing-label="page.headerNav.trailingLabel"
				:busy="isBrowseBusy"
				@prev="handleHeaderPrev"
				@next="handleHeaderNext"
			/>
			<view class="menstrual-home__jump-row">
				<JumpTabs :items="page.jumpTabs.items" :value="page.jumpTabs.value" :busy="isBrowseBusy" @jump="handleJump" />
				<view v-if="userRole !== 'viewer'" class="menstrual-home__batch-actions">
					<view
						v-if="panelMode !== 'batch'"
						class="menstrual-home__batch-btn menstrual-home__batch-btn--toggle"
						hover-class="ui-pressable-hover"
						:hover-stay-time="70"
						@tap="handleBatchToggleTap"
					>
						<text class="menstrual-home__batch-btn-label menstrual-home__batch-btn-label--toggle">批量选择</text>
					</view>
					<template v-else>
						<view
							class="menstrual-home__batch-btn menstrual-home__batch-btn--save"
							:class="{ 'menstrual-home__batch-btn--disabled': !selectedBatchKeys.length || isMutating }"
							hover-class="ui-pressable-hover"
							:hover-stay-time="70"
							@tap="handleBatchSaveTap"
						>
							<text class="menstrual-home__batch-btn-label menstrual-home__batch-btn-label--save">保存</text>
						</view>
						<view
							class="menstrual-home__batch-btn menstrual-home__batch-btn--cancel"
							:hover-stay-time="70"
							hover-class="ui-pressable-hover"
							@tap="cancelBatchMode"
						>
							<text class="menstrual-home__batch-btn-label">取消</text>
						</view>
					</template>
				</view>
			</view>
			<CalendarGrid
				ref="calendarGrid"
				:weeks="page.calendarCard.weeks"
				:weekday-labels="page.calendarCard.weekdayLabels"
				:interactive="page.viewModeControl.value === 'three-week'"
				:selected-keys="selectedBatchKeys"
				:preview-period-marked="panelMode === 'batch' ? batchDraft.isPeriod : null"
				:busy="isBrowseBusy"
				@cell-tap="handleCellTap"
				@batch-start="handleBatchStart"
				@batch-extend="handleBatchExtend"
				@batch-end="handleBatchEnd"
			/>
			<CalendarLegend :items="page.legend" />
			<SelectedDatePanel
				v-if="page && userRole !== 'viewer'"
				:title="panelMode === 'batch' ? batchPanelTitle : page.selectedDatePanel.title"
				:badge="panelMode === 'batch' ? '' : page.selectedDatePanel.badge"
				:summary-items="panelMode === 'batch' ? batchPanelSummaryItems : page.selectedDatePanel.summaryItems"
				:attribute-rows="panelMode === 'batch' ? batchPanelAttributeRows : page.selectedDatePanel.attributeRows"
				:note="panelMode === 'batch' ? '' : page.selectedDatePanel.note"
				:period-chip-text="panelMode === 'batch' ? '经期' : page.selectedDatePanel.periodChipText"
				:period-chip-selected="panelMode === 'batch' ? batchDraft.isPeriod : page.selectedDatePanel.periodChipSelected"
				:initial-period-marked="panelMode === 'batch' ? batchDraft.isPeriod : page.selectedDatePanel.initialPeriodMarked"
				:initial-editor-open="panelMode === 'batch' ? false : page.selectedDatePanel.initialEditorOpen"
				:show-note="panelMode !== 'batch'"
				:busy="isMutating"
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
			<view
				v-if="loadError"
				class="menstrual-home__state-action"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="retryInitialLoad"
			>
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
		applyHeroSnapshotToPageModel,
		applyBatchPeriodDraftToPageModel,
		applyClearAttributesToPageModel,
		applySingleDayPeriodActionToPageModel,
		applySelectedDateNoteToPageModel,
		applyToggleAttributeOptionToPageModel,
		createEmptyDayDetail,
		createOptionRows,
		createMenstrualHomePageModel,
		createSummaryItems,
		resolveJumpTargetDate,
		shiftFocusDate
	} from '../../components/menstrual/home-contract-adapter.js';
	import {
		DEFAULT_MENSTRUAL_HOME_CONTEXT,
		getSingleDayPeriodAction,
		loadMenstrualCalendarWindow,
		loadMenstrualDayDetail,
		loadMenstrualHomeView,
		loadMenstrualModuleSettings,
		loadMenstrualHomePageModel
	} from '../../services/menstrual/home-contract-service.js';
	import {
		applySingleDayPeriodAction,
		persistBatchDateDetails,
		persistBatchPeriodRange,
		persistSelectedDateNote,
		persistSelectedDateDetails
	} from '../../services/menstrual/home-command-service.js';
	import { resolveRefreshPlan } from '../../services/menstrual/home-refresh-scope.js';
	import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';
	import { createInviteToken, leaveModule } from '../../services/sharing/sharing-command-service.js';

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
				isRefreshingSnapshot: false,
				isRefreshingCalendar: false,
				isRefreshingDayDetail: false,
				isRefreshingHero: false,
				snapshotRequestId: 0,
				calendarRequestId: 0,
				dayDetailRequestId: 0,
				heroRefreshRequestId: 0,
				panelMode: 'single-day',
				batchStartKey: null,
				batchEndKey: null,
				batchHoveredKey: null,
				batchSelectedKeysState: [],
				batchDraft: {
					isPeriod: true,
					flowLevel: null,
					painLevel: null,
					colorLevel: null
				},
				contractContext: { ...DEFAULT_MENSTRUAL_HOME_CONTEXT },
				rawContracts: null,
				userRole: 'owner'
			};
		},
		computed: {
			allCalendarCells() {
				return this.page?.calendarCard?.weeks?.flatMap((week) => week.cells) || [];
			},
			selectedBatchKeys() {
				if (this.panelMode !== 'batch') return [];
				return this.batchSelectedKeysState;
			},
			isRefreshing() {
				return this.isRefreshingSnapshot || this.isRefreshingCalendar || this.isRefreshingDayDetail;
			},
			isBrowseBusy() {
				return this.isRefreshing || this.isMutating;
			},
			batchPanelTitle() {
				const cells = this.allCalendarCells.filter(c => this.selectedBatchKeys.includes(c.key) && c.isoDate);
				if (!cells.length) return '批量记录';
				const fmt = d => d.slice(5).replace('-', '/');
				const first = cells[0].isoDate;
				const last = cells[cells.length - 1].isoDate;
				return first === last
					? `批量记录 ${fmt(first)}`
					: `批量记录 ${fmt(first)}-${fmt(last)}`;
			},
			batchPanelAttributeRows() {
				return createOptionRows(this.batchDraft);
			},
			batchPanelSummaryItems() {
				return createSummaryItems(this.batchDraft);
			}
		},
		// 小程序分享钩子：用户点击 open-type="share" 按钮时触发
		// 返回 Promise 以支持异步生成 token（基础库 2.12.0+）
		onShareAppMessage() {
			return createInviteToken({
				apiBaseUrl: this.contractContext.apiBaseUrl,
				openid: this.contractContext.openid,
				moduleInstanceId: this.contractContext.moduleInstanceId,
			}).then((result) => ({
				title: '邀请你查看月经记录',
				path: `pages/join/index?token=${encodeURIComponent(result?.data?.token)}&openid=${encodeURIComponent(this.contractContext.openid)}&apiBaseUrl=${encodeURIComponent(this.contractContext.apiBaseUrl)}`,
			})).catch((err) => {
				console.error('[onShareAppMessage] token 生成失败:', err);
				return { title: '月经记录' };
			});
		},
		onLoad(options) {
			const runtimeOptions = mergeH5RouteQuery(options || {});
			const d = v => v ? decodeURIComponent(v) : v;
			this.contractContext = {
				...DEFAULT_MENSTRUAL_HOME_CONTEXT,
				apiBaseUrl: d(runtimeOptions.apiBaseUrl) || DEFAULT_MENSTRUAL_HOME_CONTEXT.apiBaseUrl,
				openid: d(runtimeOptions.openid) || DEFAULT_MENSTRUAL_HOME_CONTEXT.openid,
				moduleInstanceId: d(runtimeOptions.moduleInstanceId) || DEFAULT_MENSTRUAL_HOME_CONTEXT.moduleInstanceId,
				profileId: d(runtimeOptions.profileId) || DEFAULT_MENSTRUAL_HOME_CONTEXT.profileId,
				today: d(runtimeOptions.today) || DEFAULT_MENSTRUAL_HOME_CONTEXT.today
			};
			this.activeDate = this.contractContext.today;
			this.focusDate = this.contractContext.today;
			this.retryInitialLoad();
		},
		onPageScroll() {
			this.$refs.calendarGrid?.invalidateCellRects?.();
		},
		methods: {
			getSelectedDayDetail(selectedDate) {
				if (this.rawContracts?.dayDetail?.dayRecord?.date === selectedDate) {
					return this.rawContracts.dayDetail;
				}
				return createEmptyDayDetail({
					moduleInstanceId: this.contractContext.moduleInstanceId,
					profileId: this.contractContext.profileId,
					date: selectedDate
				});
			},
			getSelectedSingleDayPeriodAction(selectedDate) {
				if (this.rawContracts?.singleDayPeriodAction?.selectedDate === selectedDate) {
					return this.rawContracts.singleDayPeriodAction;
				}
				return null;
			},
			rebuildLocalPage({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode, useCalendarWindow = true, dayDetail = null } = {}) {
				if (!this.rawContracts?.homeView) {
					return this.page;
				}
				return createMenstrualHomePageModel({
					homeView: this.rawContracts.homeView,
					moduleSettings: this.rawContracts.moduleSettings,
					dayDetail: dayDetail || this.getSelectedDayDetail(selectedDate),
					singleDayPeriodAction: this.getSelectedSingleDayPeriodAction(selectedDate),
					calendarWindow: useCalendarWindow ? this.rawContracts.calendarWindow : null,
					today: this.contractContext.today,
					focusDate,
					viewMode
				});
			},
			applyLocalBrowseState({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode, useCalendarWindow = true, dayDetail = null } = {}) {
				this.activeDate = selectedDate;
				this.focusDate = focusDate;
				this.viewMode = viewMode;
				this.page = this.rebuildLocalPage({
					selectedDate,
					focusDate,
					viewMode,
					useCalendarWindow,
					dayDetail
				});
			},
			async refreshHomeSnapshot(activeDate, options = {}) {
				const requestId = options.requestId || ++this.snapshotRequestId;
				const nextViewMode = options.viewMode || this.viewMode;
				const nextFocusDate = options.focusDate || this.focusDate || activeDate || this.activeDate;
				const result = await loadMenstrualHomePageModel({
					...this.contractContext,
					activeDate,
					focusDate: nextFocusDate,
					viewMode: nextViewMode,
					fallbackOnError: options.fallbackOnError
				});
				if (requestId !== this.snapshotRequestId) {
					return result;
				}
				this.page = result.page;
				this.loadError = result.error || '';
				this.rawContracts = result.raw;
				this.userRole = this.rawContracts?.callerRole || 'owner';
				this.activeDate = result.raw?.dayDetail?.dayRecord?.date || activeDate || this.activeDate;
				this.focusDate = result.raw?.focusDate || nextFocusDate;
				this.viewMode = result.raw?.viewMode || nextViewMode;
				return result;
			},
			async refreshCalendarWindow({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode } = {}) {
				const requestId = ++this.calendarRequestId;
				this.isRefreshingCalendar = true;
				this.loadError = '';
				try {
					const result = await loadMenstrualCalendarWindow({
						...this.contractContext,
						focusDate,
						viewMode
					});
					if (requestId !== this.calendarRequestId) {
						return result;
					}
					this.rawContracts = {
						...this.rawContracts,
						calendarWindow: result.calendarWindow,
						focusDate: result.focusDate,
						viewMode: result.viewMode
					};
					this.page = this.rebuildLocalPage({
						selectedDate,
						focusDate,
						viewMode,
						useCalendarWindow: true
					});
					return result;
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
					throw error;
				} finally {
					if (requestId === this.calendarRequestId) {
						this.isRefreshingCalendar = false;
					}
				}
			},
			async refreshSelectedDayDetail({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode } = {}) {
				const requestId = ++this.dayDetailRequestId;
				this.isRefreshingDayDetail = true;
				this.loadError = '';
				try {
					const [dayDetail, singleDayPeriodAction] = await Promise.all([
						loadMenstrualDayDetail({
							...this.contractContext,
							activeDate: selectedDate
						}),
						getSingleDayPeriodAction({
							apiBaseUrl: this.contractContext.apiBaseUrl,
							openid: this.contractContext.openid,
							moduleInstanceId: this.contractContext.moduleInstanceId,
							date: selectedDate
						})
					]);
					if (requestId !== this.dayDetailRequestId) {
						return dayDetail;
					}
					this.rawContracts = {
						...this.rawContracts,
						dayDetail,
						singleDayPeriodAction
					};
					this.page = this.rebuildLocalPage({
						selectedDate,
						focusDate,
						viewMode,
						useCalendarWindow: true,
						dayDetail
					});
					return dayDetail;
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
					throw error;
				} finally {
					if (requestId === this.dayDetailRequestId) {
						this.isRefreshingDayDetail = false;
					}
				}
			},
			async refreshHeroSnapshot({
				activeDate = this.activeDate,
				focusDate = this.focusDate,
				viewMode = this.viewMode,
				backgroundRequestId
			} = {}) {
				const requestId = backgroundRequestId || ++this.heroRefreshRequestId;
				this.isRefreshingHero = true;
				try {
					const [homeView, moduleSettings] = await Promise.all([
						loadMenstrualHomeView({
							...this.contractContext,
							activeDate,
							focusDate,
							viewMode
						}),
						loadMenstrualModuleSettings(this.contractContext)
					]);
					if (requestId !== this.heroRefreshRequestId) {
						return homeView;
					}
					this.rawContracts = {
						...this.rawContracts,
						homeView,
						moduleSettings
					};
					if (this.page) {
						this.page = applyHeroSnapshotToPageModel(this.page, {
							homeView,
							moduleSettings,
							today: this.contractContext.today
						});
					}
					return homeView;
				} finally {
					if (requestId === this.heroRefreshRequestId) {
						this.isRefreshingHero = false;
					}
				}
			},
			scheduleDeferredHeroRefresh(scopes) {
				const plan = resolveRefreshPlan(scopes);
				if (!plan.deferredHero) return;
				const requestId = ++this.heroRefreshRequestId;
				Promise.resolve()
					.then(() => this.refreshHeroSnapshot({
						activeDate: this.activeDate,
						focusDate: this.focusDate,
						viewMode: this.viewMode,
						backgroundRequestId: requestId
					}))
					.catch((error) => {
						if (requestId !== this.heroRefreshRequestId) return;
						this.loadError = error instanceof Error
							? `写入成功，但主页摘要刷新失败：${error.message}`
							: '写入成功，但主页摘要刷新失败';
					});
			},
			async refreshByScopes(scopes) {
				const plan = resolveRefreshPlan(scopes);
				switch (plan.immediate) {
					case 'skip':
						this.scheduleDeferredHeroRefresh(scopes);
						return;
					case 'dayDetail':
						await this.refreshSelectedDayDetail({
							selectedDate: this.activeDate,
							focusDate: this.focusDate,
							viewMode: this.viewMode
						});
						this.scheduleDeferredHeroRefresh(scopes);
						return;
					case 'calendar':
						await this.refreshCalendarWindow({
							selectedDate: this.activeDate,
							focusDate: this.focusDate,
							viewMode: this.viewMode
						});
						this.scheduleDeferredHeroRefresh(scopes);
						return;
					case 'calendar+dayDetail':
						await this.refreshCalendarWindow({
							selectedDate: this.activeDate,
							focusDate: this.focusDate,
							viewMode: this.viewMode
						});
						await this.refreshSelectedDayDetail({
							selectedDate: this.activeDate,
							focusDate: this.focusDate,
							viewMode: this.viewMode
						});
						this.scheduleDeferredHeroRefresh(scopes);
						return;
					case 'fullSnapshot':
					default:
						await this.refreshHomeSnapshot(this.activeDate, {
							focusDate: this.focusDate,
							viewMode: this.viewMode
						});
				}
			},
			async retryInitialLoad() {
				this.loadError = '';
				this.isRefreshingSnapshot = true;
				try {
					await this.refreshHomeSnapshot(this.activeDate, {
						fallbackOnError: false,
						focusDate: this.focusDate,
						viewMode: this.viewMode
					});
				} catch (error) {
					this.page = null;
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
				} finally {
					this.isRefreshingSnapshot = false;
				}
			},
			handleCellTap(cell) {
				if (!cell?.isoDate) return;
				if (this.isBrowseBusy) return;
				if (this.panelMode === 'batch') {
					if (cell.selectable === false) return;
					if (!this.batchStartKey) {
						this.enterBatchMode(cell);
						return;
					}
					this.handleBatchExtend(cell);
					return;
				}
				this.panelMode = 'single-day';
				this.applyLocalBrowseState({
					selectedDate: cell.isoDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode,
					useCalendarWindow: true,
					dayDetail: this.getSelectedDayDetail(cell.isoDate)
				});
				this.refreshSelectedDayDetail({
					selectedDate: cell.isoDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode
				}).catch(() => {});
			},
			handleViewModeChange(nextMode) {
				if (this.isBrowseBusy) return;
				if (!nextMode || nextMode === this.viewMode) return;
				this.panelMode = 'single-day';
				this.applyLocalBrowseState({
					selectedDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: nextMode,
					useCalendarWindow: false
				});
				this.refreshCalendarWindow({
					selectedDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: nextMode
				}).catch(() => {});
			},
			handleHeaderPrev() {
				if (this.isBrowseBusy) return;
				this.panelMode = 'single-day';
				const nextFocusDate = shiftFocusDate(this.focusDate, this.viewMode, -1);
				this.applyLocalBrowseState({
					selectedDate: this.activeDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode,
					useCalendarWindow: false
				});
				this.refreshCalendarWindow({
					selectedDate: this.activeDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode
				}).catch(() => {});
			},
			handleHeaderNext() {
				if (this.isBrowseBusy) return;
				this.panelMode = 'single-day';
				const nextFocusDate = shiftFocusDate(this.focusDate, this.viewMode, 1);
				this.applyLocalBrowseState({
					selectedDate: this.activeDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode,
					useCalendarWindow: false
				});
				this.refreshCalendarWindow({
					selectedDate: this.activeDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode
				}).catch(() => {});
			},
			handleJump(jumpKey) {
				if (this.isBrowseBusy) return;
				const targetDate = resolveJumpTargetDate(this.rawContracts?.homeView, jumpKey, this.contractContext.today);
				if (!targetDate) return;
				this.panelMode = 'single-day';
				this.applyLocalBrowseState({
					selectedDate: targetDate,
					focusDate: targetDate,
					viewMode: this.viewMode,
					useCalendarWindow: false,
					dayDetail: this.getSelectedDayDetail(targetDate)
				});
				Promise.all([
					this.refreshCalendarWindow({
						selectedDate: targetDate,
						focusDate: targetDate,
						viewMode: this.viewMode
					}),
					this.refreshSelectedDayDetail({
						selectedDate: targetDate,
						focusDate: targetDate,
						viewMode: this.viewMode
					})
				]).catch(() => {});
			},
			createEmptyBatchDraft() {
				return {
					isPeriod: true,
					flowLevel: null,
					painLevel: null,
					colorLevel: null
				};
			},
			enterBatchMode(startCell = null) {
				this.panelMode = 'batch';
				this.batchDraft = this.createEmptyBatchDraft();
				this.batchStartKey = startCell?.key || null;
				this.batchEndKey = startCell?.key || null;
				this.batchHoveredKey = startCell?.key || null;
				this.syncBatchSelectionRange();
				if (startCell?.isoDate) {
					this.activeDate = startCell.isoDate;
				}
			},
			async runOptimisticMutation(nextPage, command) {
				if (this.isMutating) return;
				const previousPage = this.page;
				let affectedScopes = null;
				this.page = nextPage;
				this.loadError = '';
				this.isMutating = true;

				try {
					affectedScopes = (await command())?.affectedScopes ?? null;
				} catch (error) {
					this.page = previousPage;
					this.loadError = error instanceof Error ? error.message : 'Command failed';
					this.isMutating = false;
					return;
				}

				try {
					await this.refreshByScopes(affectedScopes);
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
				let affectedScopes = null;

				try {
					affectedScopes = (await command())?.affectedScopes ?? null;
				} catch (error) {
					this.loadError = error instanceof Error ? error.message : 'Command failed';
					this.isMutating = false;
					return;
				}

				try {
					await this.refreshByScopes(affectedScopes);
				} catch (error) {
					this.loadError = error instanceof Error ? `写入成功，但刷新失败：${error.message}` : '写入成功，但刷新失败';
				} finally {
					this.isMutating = false;
				}
			},
			async runOptimisticBatchMutation(nextPage, command) {
				if (this.isMutating) return;
				const previousState = {
					page: this.page,
					panelMode: this.panelMode,
					batchStartKey: this.batchStartKey,
					batchEndKey: this.batchEndKey,
					batchHoveredKey: this.batchHoveredKey,
					batchSelectedKeysState: [...this.batchSelectedKeysState],
					activeDate: this.activeDate
				};
				let affectedScopes = null;
				this.page = nextPage;
				this.panelMode = 'single-day';
				this.batchStartKey = null;
				this.batchEndKey = null;
				this.batchHoveredKey = null;
				this.batchSelectedKeysState = [];
				this.loadError = '';
				this.isMutating = true;

				try {
					affectedScopes = (await command())?.affectedScopes ?? null;
				} catch (error) {
					this.page = previousState.page;
					this.panelMode = previousState.panelMode;
					this.batchStartKey = previousState.batchStartKey;
					this.batchEndKey = previousState.batchEndKey;
					this.batchHoveredKey = previousState.batchHoveredKey;
					this.batchSelectedKeysState = previousState.batchSelectedKeysState;
					this.activeDate = previousState.activeDate;
					this.loadError = error instanceof Error ? error.message : 'Command failed';
					this.isMutating = false;
					return;
				}

				try {
					await this.refreshByScopes(affectedScopes);
				} catch (error) {
					this.page = nextPage;
					this.loadError = error instanceof Error ? `写入成功，但刷新失败：${error.message}` : '写入成功，但刷新失败';
				} finally {
					this.isMutating = false;
				}
			},
			handleToggleAttributeOption(payload) {
				if (this.panelMode === 'batch') {
					const row = this.batchPanelAttributeRows.find(r => r.key === payload.rowKey);
					if (!row) return;
					const optionIndex = row.options.findIndex(o => o.key === payload.optionKey);
					if (optionIndex === -1) return;
					const level = optionIndex + 1;
					const levelKey = `${payload.rowKey}Level`;
					const currentLevel = this.batchDraft[levelKey];
					this.batchDraft = {
						...this.batchDraft,
						[levelKey]: currentLevel === level ? null : level
					};
					return;
				}
				const nextPage = applyToggleAttributeOptionToPageModel(this.page, payload);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
					context: this.contractContext,
					activeDate: this.activeDate,
					pageModel: nextPage
				}));
			},
			handleClearAttributes() {
				if (this.panelMode === 'batch') {
					this.batchDraft = { ...this.batchDraft, flowLevel: null, painLevel: null, colorLevel: null };
					return;
				}
				const nextPage = applyClearAttributesToPageModel(this.page);
				return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
					context: this.contractContext,
					activeDate: this.activeDate,
					pageModel: nextPage
				}));
			},
			async handleTogglePeriod(isPeriodMarked) {
				if (this.panelMode === 'batch') {
					this.batchDraft = { ...this.batchDraft, isPeriod: isPeriodMarked };
					return;
				}
				const resolvedAction = this.rawContracts?.singleDayPeriodAction?.resolvedAction;
				if (!resolvedAction?.action || !resolvedAction?.effect) return;

				const prompt = resolvedAction.prompt;
				if (prompt?.required) {
					const confirmed = await new Promise((resolve) => {
						uni.showModal({
							title: '提示',
							content: prompt?.message || '',
							confirmText: prompt?.confirmLabel || '确认',
							cancelText: prompt?.cancelLabel || '取消',
							success: (result) => {
								resolve(Boolean(result?.confirm));
							},
							fail: () => resolve(false)
						});
					});
					if (!confirmed) return;
					const nextPage = applySingleDayPeriodActionToPageModel(this.page, { resolvedAction });
					return this.runOptimisticMutation(nextPage, () => applySingleDayPeriodAction({
						context: this.contractContext,
						activeDate: this.activeDate,
						action: resolvedAction.action,
						confirmed: true
					}));
				}

				const nextPage = applySingleDayPeriodActionToPageModel(this.page, { resolvedAction });
				return this.runOptimisticMutation(nextPage, () => applySingleDayPeriodAction({
					context: this.contractContext,
					activeDate: this.activeDate,
					action: resolvedAction.action
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
				this.enterBatchMode(cell);
			},
			handleBatchExtend(cell) {
				if (!cell?.key) return;
				if (cell.selectable === false) return;
				if (!this.batchStartKey) {
					this.enterBatchMode(cell);
					return;
				}
				if (cell.key === this.batchHoveredKey) return;
				this.batchEndKey = cell.key;
				this.batchHoveredKey = cell.key;
				this.syncBatchSelectionRange();
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
				if (this.isMutating) return;
				this.panelMode = 'single-day';
				this.batchStartKey = null;
				this.batchEndKey = null;
				this.batchHoveredKey = null;
				this.batchSelectedKeysState = [];
			},
			handleBatchToggleTap() {
				if (this.isBrowseBusy) return;
				this.enterBatchMode();
			},
			handleBatchSaveTap() {
				if (!this.selectedBatchKeys.length || this.isMutating) return;
				return this.applyBatchAction();
			},
			applyBatchAction() {
				if (!this.selectedBatchKeys.length) return;
				const ranges = this.buildBatchRanges(this.selectedBatchKeys);
				const nextPage = applyBatchPeriodDraftToPageModel(this.page, {
					selectedKeys: this.selectedBatchKeys,
					batchDraft: this.batchDraft,
					activeDate: this.activeDate
				});

				return this.runOptimisticBatchMutation(nextPage, async () => {
					for (const range of ranges) {
						await persistBatchPeriodRange({
							context: this.contractContext,
							action: this.batchDraft.isPeriod ? 'set-period' : 'clear-record',
							startDate: range.startDate,
							endDate: range.endDate
						});
					}

					const { flowLevel, painLevel, colorLevel } = this.batchDraft;
					if (flowLevel !== null || painLevel !== null || colorLevel !== null) {
						const dates = this.allCalendarCells
							.filter(c => this.selectedBatchKeys.includes(c.key) && c.isoDate)
							.map(c => c.isoDate);
						await persistBatchDateDetails({
							context: this.contractContext,
							dates,
							flowLevel,
							painLevel,
							colorLevel
						});
					}
					return { affectedScopes: ['calendar', 'dayDetail', 'prediction'] };
				});
			},
			syncBatchSelectionRange() {
				if (!this.batchStartKey || !this.batchEndKey) {
					this.batchSelectedKeysState = [];
					return;
				}

				const startIndex = this.allCalendarCells.findIndex((cell) => cell.key === this.batchStartKey);
				const endIndex = this.allCalendarCells.findIndex((cell) => cell.key === this.batchEndKey);
				if (startIndex === -1 || endIndex === -1) {
					this.batchSelectedKeysState = [];
					return;
				}

				const rangeStart = Math.min(startIndex, endIndex);
				const rangeEnd = Math.max(startIndex, endIndex);
				this.batchSelectedKeysState = this.allCalendarCells
					.slice(rangeStart, rangeEnd + 1)
					.filter((cell) => cell.selectable !== false)
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
			// handleShareTap 已移除：小程序分享必须通过 onShareAppMessage 钩子 + open-type="share" 按钮触发
			// DEV ONLY: 生成 token 并弹窗显示，用于在未认证环境手动测试 join 流程
			async handleDebugCopyToken() {
				try {
					const result = await createInviteToken({
						apiBaseUrl: this.contractContext.apiBaseUrl,
						openid: this.contractContext.openid,
						moduleInstanceId: this.contractContext.moduleInstanceId,
					});
					const token = result?.data?.token;
					const joinPath = `/pages/join/index?token=${token}&openid=${this.contractContext.openid}`;
					uni.showModal({
						title: '[DEV] Join 页测试链接',
						content: joinPath,
						showCancel: false,
						confirmText: '好的',
					});
					console.log('[DEV] join path:', joinPath);
				} catch (err) {
					console.error('[handleDebugCopyToken]', err);
					uni.showToast({ title: '生成失败', icon: 'none' });
				}
			},
			async handleLeaveTap() {
				const confirmed = await new Promise((resolve) => {
					uni.showModal({
						title: '退出共享',
						content: '退出后将无法继续查看这个模块的数据。',
						confirmText: '退出',
						confirmColor: '#dc2626',
						success: (res) => resolve(res.confirm),
					});
				});
				if (!confirmed) return;

				try {
					await leaveModule({
						apiBaseUrl: this.contractContext.apiBaseUrl,
						openid: this.contractContext.openid,
						moduleInstanceId: this.contractContext.moduleInstanceId,
					});
					uni.showToast({ title: '已退出共享', icon: 'success' });
					setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1000);
				} catch (err) {
					uni.showToast({ title: '退出失败', icon: 'none' });
				}
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

	.menstrual-home__hero {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		padding: 16rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.menstrual-home__hero-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12rpx;
	}

	.menstrual-home__hero-label {
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
	}

	.menstrual-home__hero-sharing-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44rpx;
		padding: 0 16rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.menstrual-home__hero-sharing-chip-label {
		font-size: 20rpx;
		line-height: 1;
		color: $text-secondary;
	}

	.menstrual-home__hero-status-frame {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		padding: 18rpx 20rpx;
		border-radius: 24rpx;
	}

	.menstrual-home__hero-status-icon {
		width: 44rpx;
		height: 44rpx;
		flex-shrink: 0;
	}

	.menstrual-home__hero-status-text {
		font-size: 36rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.menstrual-home__hero-meta {
		font-size: 18rpx;
		line-height: 1.4;
		color: #b55d51;
	}

	.menstrual-home__hero-info-row {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 20rpx;
	}

	.menstrual-home__hero-info-frame {
		display: flex;
		flex-direction: column;
		width: 204rpx;
		min-height: 78rpx;
		gap: 6rpx;
		padding: 10rpx 20rpx;
		border-radius: 24rpx;
		background: #F3EEE7;
		justify-content: center;
		align-items: center;
	}

	.menstrual-home__hero-info-frame--next {
		background: #F3D7D1;
	}

	.menstrual-home__hero-info-label {
		font-size: 20rpx;
		line-height: 1.1;
		color: $text-muted;
	}

	.menstrual-home__hero-info-value {
		font-size: 22rpx;
		line-height: 1.1;
		font-weight: $font-weight-medium;
		color: $text-primary;
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
		padding: 0 20rpx;
		border-radius: 20rpx;
		border-width: 2rpx;
		border-style: solid;
		border-color: transparent;
	}

	.menstrual-home__batch-btn--save {
		background: $accent-period;
	}

	.menstrual-home__batch-btn--cancel {
		background: $bg-subtle;
	}

	.menstrual-home__batch-btn--toggle {
		background: #fffdf9;
		border-color: #e9ddd1;
	}

	.menstrual-home__batch-btn--disabled {
		opacity: 0.45;
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

	.menstrual-home__batch-btn-label--toggle {
		color: $text-primary;
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

	.menstrual-home__readonly-badge {
		display: inline-flex;
		align-items: center;
		background: #fef3c7;
		border-radius: 6px;
		padding: 2px 8px;
		margin-bottom: 8px;
	}

	.menstrual-home__readonly-label {
		font-size: 12px;
		color: #92400e;
		font-weight: 600;
	}

	.menstrual-home__share-btn {
		padding: 4px 12px;
		background: #faf7f2;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 13px;
		color: #374151;
		// 重置 button 默认样式
		line-height: normal;
		margin: 0;
		&::after { border: none; }
	}

	.menstrual-home__leave-btn {
		padding: 4px 12px;
		background: #fee2e2;
		border-radius: 8px;
		font-size: 13px;
		color: #dc2626;
	}
</style>
