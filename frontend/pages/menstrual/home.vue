<template>
	<view class="menstrual-home u-page-shell" @tap="handleHomeRootTap">
		<PageNavBar
			v-if="page"
			title="经期小记"
			icon-src="/static/menstrual/menstruation.svg"
			:show-back="true"
		/>
		<view
			v-if="page"
			class="menstrual-home__hero"
			:class="{ 'menstrual-home__hero--emphasis': page.heroCard.statusFrame.phaseStatus?.emphasis }"
		>
			<view class="menstrual-home__hero-header">
				<text class="menstrual-home__hero-label">{{ page.heroCard.label }}</text>
				<view class="menstrual-home__hero-sharing-chip">
					<text class="menstrual-home__hero-sharing-chip-label">{{ page.heroCard.sharingLabel }}</text>
				</view>
			</view>
			<view v-if="userRole === 'viewer'" class="menstrual-home__readonly-badge">
				<text class="menstrual-home__readonly-label">只读</text>
			</view>
			<view v-if="userRole === 'viewer'" class="menstrual-home__leave-btn" @tap="handleLeaveTap">
				<text>退出共享</text>
			</view>
			<view class="menstrual-home__hero-status-frame">
				<template
					v-if="page.heroCard.statusFrame.phaseStatus && page.heroCard.statusFrame.phaseStatus.phase !== null && page.heroCard.statusFrame.phaseStatus.phase !== '经期'"
				>
					<view class="menstrual-home__hero-phase-row">
						<view
							class="menstrual-home__hero-phase-group"
							:class="{ 'menstrual-home__hero-phase-group--emphasis': page.heroCard.statusFrame.phaseStatus.emphasis }"
						>
							<image
								class="menstrual-home__hero-phase-icon"
								:src="getPhaseIconUrl(page.heroCard.statusFrame.phaseStatus.phase)"
								mode="aspectFit"
							/>
							<text
								class="menstrual-home__hero-phase-name"
								:class="{ 'menstrual-home__hero-phase-name--emphasis': page.heroCard.statusFrame.phaseStatus.emphasis }"
							>
								{{ page.heroCard.statusFrame.phaseStatus.phase }}
							</text>
							<view
								v-if="page.heroCard.statusFrame.phaseStatus.showReliabilityWarning"
								class="menstrual-home__hero-phase-warning-btn"
								@tap="handlePhaseWarningTap"
							>
								<text class="menstrual-home__hero-phase-warning-btn-label">!</text>
							</view>
						</view>
						<view class="menstrual-home__hero-hint-group">
							<image
								v-if="shouldShowPhaseHintIcon(page.heroCard.statusFrame.phaseStatus)"
								class="menstrual-home__hero-hint-icon"
								src="/static/menstrual/warning.svg"
								mode="aspectFit"
							/>
							<text
								class="menstrual-home__hero-hint-text"
								:class="{ 'menstrual-home__hero-hint-text--emphasis': page.heroCard.statusFrame.phaseStatus.isLutealLate }"
							>
								{{ page.heroCard.statusFrame.phaseStatus.hint }}
							</text>
						</view>
					</view>
				</template>
				<template v-else-if="page.heroCard.statusFrame.phaseStatus && page.heroCard.statusFrame.phaseStatus.phase === null">
					<view class="menstrual-home__hero-phase-row">
						<view class="menstrual-home__hero-phase-group">
							<text class="menstrual-home__hero-status-text">
								{{ page.heroCard.statusFrame.text }}
							</text>
							<view
								v-if="page.heroCard.statusFrame.phaseStatus.showReliabilityWarning"
								class="menstrual-home__hero-phase-warning-btn"
								@tap="handlePhaseWarningTap"
							>
								<text class="menstrual-home__hero-phase-warning-btn-label">!</text>
							</view>
						</view>
						<view class="menstrual-home__hero-hint-group">
							<text class="menstrual-home__hero-hint-text">
								{{ page.heroCard.statusFrame.phaseStatus.hint }}
							</text>
						</view>
					</view>
				</template>
				<template v-else-if="page.heroCard.statusFrame.state === 'no_record'">
					<view class="menstrual-home__hero-empty-state">
						<image class="menstrual-home__hero-empty-icon" src="/static/menstrual/start.png" mode="aspectFit" />
						<view class="menstrual-home__hero-empty-copy-group">
							<text class="menstrual-home__hero-status-text menstrual-home__hero-status-text--empty">
								{{ page.heroCard.statusFrame.text }}
							</text>
							<text class="menstrual-home__hero-empty-copy">
								{{ page.heroCard.statusFrame.emptyStateCopy }}
							</text>
						</view>
					</view>
				</template>
				<template v-else>
					<image class="menstrual-home__hero-status-icon" :src="page.heroCard.statusFrame.iconUrl" mode="aspectFit" />
					<text class="menstrual-home__hero-status-text">{{ page.heroCard.statusFrame.text }}</text>
				</template>
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

		<view
			v-if="page?.reportEntryCard"
			class="menstrual-home__report-entry"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handleReportEntryTap"
		>
			<view class="menstrual-home__report-entry-copy">
				<view class="menstrual-home__report-entry-title-row">
					<image class="menstrual-home__report-entry-title-icon" src="/static/menstrual/calendar-menstrual.svg" mode="aspectFit" />
					<text class="menstrual-home__report-entry-title">{{ page.reportEntryCard.title }}</text>
				</view>
				<text class="menstrual-home__report-entry-description">{{ page.reportEntryCard.description }}</text>
			</view>
			<image
				class="menstrual-home__report-entry-icon"
				:src="page.reportEntryCard.iconUrl"
				mode="aspectFit"
			/>
		</view>

		<view v-if="page" class="menstrual-home__content">
			<SegmentedControl
				:options="page.viewModeControl.options"
				:value="page.viewModeControl.value"
				:busy="isNavigationBusy"
				@change="handleViewModeChange"
			/>
			<HeaderNav
				:month-label="page.headerNav.monthLabel"
				:start-year-label="page.headerNav.startYearLabel"
				:end-year-label="page.headerNav.endYearLabel"
				:leading-label="browseNavLabels.leadingLabel"
				:trailing-label="browseNavLabels.trailingLabel"
				:focused-mode="page.viewModeControl.value === 'three-week'"
				:prev-invalid="false"
				:next-invalid="false"
				:inline-message="headerInlineMessage"
				:inline-message-side="headerInlineMessageSide"
				:busy="isNavigationBusy"
				@prev="handleHeaderPrev"
				@next="handleHeaderNext"
				@close-message="clearHeaderInlineMessage"
			/>
			<view class="menstrual-home__jump-row">
				<JumpTabs
					class="menstrual-home__jump-tabs"
					:items="resolvedJumpTabItems"
					:value="page.jumpTabs.value"
					:busy="isNavigationBusy"
					:inline-message="headerInlineMessage"
					:inline-message-key="headerInlineMessageSide"
					@jump="handleJump"
					@close-message="clearHeaderInlineMessage"
				/>
				<view v-if="userRole !== 'viewer'" class="menstrual-home__batch-actions">
					<view
						v-if="panelMode !== 'batch'"
						class="menstrual-home__batch-btn menstrual-home__batch-btn--toggle"
						:class="{ 'menstrual-home__batch-btn--disabled': isNavigationBusy }"
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
			<view class="menstrual-home__calendar-stage">
				<view
					class="menstrual-home__calendar-layer menstrual-home__calendar-layer--current"
					:class="currentCalendarLayerClasses"
				>
					<CalendarGrid
						ref="calendarGrid"
						:key="currentCalendarKey"
						:weeks="page.calendarCard.weeks"
						:weekday-labels="page.calendarCard.weekdayLabels"
						:interactive="true"
						:focused-date="viewMode === 'month' ? activeDate : null"
						:selected-keys="selectedBatchKeys"
						:preview-period-marked="panelMode === 'batch' ? batchDraft.isPeriod : null"
						:busy="isBrowseInteractionBusy"
						@cell-tap="handleCellTap"
						@blocked-future-tap="handleBlockedFutureTap"
						@batch-start="handleBatchStart"
						@batch-extend="handleBatchExtend"
						@batch-end="handleBatchEnd"
						@swipe-left="handleCalendarSwipeLeft"
						@swipe-right="handleCalendarSwipeRight"
					/>
				</view>
				<view
					v-if="pendingBrowsePayload"
					class="menstrual-home__calendar-layer menstrual-home__calendar-layer--pending"
					:class="pendingCalendarLayerClasses"
				>
					<CalendarGrid
						:key="pendingCalendarKey"
						:weeks="pendingBrowsePayload.pageModel.calendarCard.weeks"
						:weekday-labels="pendingBrowsePayload.pageModel.calendarCard.weekdayLabels"
						:interactive="false"
						:selected-keys="[]"
						:preview-period-marked="null"
						:busy="true"
					/>
				</view>
				<view v-if="browseMaskVisible" class="menstrual-home__calendar-mask">
					<text class="menstrual-home__calendar-mask-label">正在切换日历…</text>
				</view>
			</view>
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
				:is-editable="panelMode === 'batch' ? true : page.selectedDatePanel.isEditable"
				:busy="isMutating"
				@toggle-attribute-option="handleToggleAttributeOption"
				@clear-attributes="handleClearAttributes"
				@toggle-period="handleTogglePeriod"
				@note-change="handleNoteChange"
			/>
		</view>
		<view
			v-if="calendarInlineHintMessage && calendarInlineHintAnchorRect"
			class="menstrual-home__calendar-inline-hint"
			:style="calendarInlineHintStyle"
			@tap.stop="clearCalendarInlineHint"
		>
			<text class="menstrual-home__calendar-inline-hint-text">{{ calendarInlineHintMessage }}</text>
			<view class="menstrual-home__calendar-inline-hint-arrow"></view>
		</view>

		<LoadingScreen v-else :error-message="loadError" @retry="retryInitialLoad" />
	</view>
</template>

<script>
	import CalendarGrid from '../../components/menstrual/CalendarGrid.vue';
	import CalendarLegend from '../../components/menstrual/CalendarLegend.vue';
	import PageNavBar from '../../components/common/PageNavBar.vue';
	import HeaderNav from '../../components/menstrual/HeaderNav.vue';
	import JumpTabs from '../../components/menstrual/JumpTabs.vue';
	import {
		isJumpBoundary,
		resolveBrowseNavLabels,
		resolveJumpBoundaryMessage,
		resolveJumpTabItems
	} from '../../components/menstrual/navigation-contract.js';
	import SelectedDatePanel from '../../components/menstrual/SelectedDatePanel.vue';
	import SegmentedControl from '../../components/menstrual/SegmentedControl.vue';
	import LoadingScreen from '../../components/common/LoadingScreen.vue';
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
		invalidateMenstrualBrowseCacheByScopes,
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
	import { resolveRuntimeOpenid } from '../../utils/dev-openid.js';
	import { createInviteToken, leaveModule } from '../../services/sharing/sharing-command-service.js';
	import { createJoinPageUrl } from '../../services/menstrual/module-shell-service.js';

	const BROWSE_ANIMATION_MS = 200;
	const BROWSE_MASK_DELAY_MS = 120;
	const CALENDAR_INLINE_HINT_DURATION_MS = 1500;
	const CALENDAR_INLINE_HINT_EDGE_PADDING_PX = 72;
	const VIEW_MODE_STORAGE_KEY = 'menstrual-home-view-mode';
	const PHASE_ICON_URL_MAP = Object.freeze({
		卵泡期: '/static/menstrual/embryo.svg',
		排卵期: '/static/menstrual/sun.svg',
		黄体期: '/static/menstrual/moon.svg',
		经期: '/static/icons/coffee.svg'
	});

	const PHASE_HINT_ICON_CONFIG = Object.freeze({
		黄体期_前7天: true
	});

	export default {
		name: 'MenstrualHomePage',
		components: {
			CalendarGrid,
			CalendarLegend,
			PageNavBar,
			HeaderNav,
			JumpTabs,
			SelectedDatePanel,
			SegmentedControl,
			LoadingScreen
		},
		data() {
			return {
				page: null,
				loadError: '',
				activeDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				focusDate: DEFAULT_MENSTRUAL_HOME_CONTEXT.today,
				selectedDateKey: null,
				viewMode: 'three-week',
				isMutating: false,
				isRefreshingSnapshot: false,
				isRefreshingCalendar: false,
				isRefreshingDayDetail: false,
				isRefreshingHero: false,
				browseTransitionPhase: 'idle',
				browseTransitionDirection: null,
				browseTransitionEffect: 'slide',
				pendingBrowsePayload: null,
				currentCalendarKey: 0,
				pendingCalendarKey: 0,
				browseRequestId: 0,
				browseAnimationTimer: null,
				browseMaskDelayTimer: null,
				browseMaskShown: false,
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
				calendarInlineHintKey: '',
				calendarInlineHintMessage: '',
				calendarInlineHintAnchorRect: null,
				calendarInlineHintTimer: null,
				headerInlineMessage: '',
				headerInlineMessageSide: 'next',
				headerInlineMessageTimer: null,
				contractContext: { ...DEFAULT_MENSTRUAL_HOME_CONTEXT },
				rawContracts: null,
				userRole: 'owner'
			};
		},
		beforeUnmount() {
			this.clearCalendarInlineHint();
			this.clearHeaderInlineMessage();
			this.clearBrowseAnimationTimer();
			this.clearBrowseMaskTimer();
		},
		computed: {
			browseNavLabels() {
				return resolveBrowseNavLabels(this.viewMode);
			},
			resolvedJumpTabItems() {
				return resolveJumpTabItems(this.page?.jumpTabs?.items || [], this.page?.headerNav || {});
			},
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
				return this.isRefreshing || this.isMutating || this.browseTransitionPhase !== 'idle';
			},
			isNavigationBusy() {
				return this.isBrowseBusy || this.panelMode === 'batch';
			},
			isBrowseInteractionBusy() {
				return this.isRefreshing || this.isMutating || this.browseTransitionPhase !== 'idle';
			},
			browseMaskVisible() {
				return this.browseMaskShown;
			},
			calendarInlineHintStyle() {
				if (!this.calendarInlineHintAnchorRect) return {};
				const viewportWidth = this.resolveViewportWidth();
				const centerX = (this.calendarInlineHintAnchorRect.left + this.calendarInlineHintAnchorRect.right) / 2;
				const clampedX = Math.max(
					CALENDAR_INLINE_HINT_EDGE_PADDING_PX,
					Math.min(centerX, viewportWidth - CALENDAR_INLINE_HINT_EDGE_PADDING_PX)
				);
				return {
					left: `${clampedX}px`,
					top: `${this.calendarInlineHintAnchorRect.top - 10}px`
				};
			},
			currentCalendarLayerClasses() {
				return {
					'menstrual-home__calendar-layer--slide-out-left': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'slide'
						&& this.browseTransitionDirection === 'next',
					'menstrual-home__calendar-layer--slide-out-right': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'slide'
						&& this.browseTransitionDirection === 'prev',
					'menstrual-home__calendar-layer--fade-out': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'fade'
				};
			},
			pendingCalendarLayerClasses() {
				return {
					'menstrual-home__calendar-layer--slide-in-left': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'slide'
						&& this.browseTransitionDirection === 'next',
					'menstrual-home__calendar-layer--slide-in-right': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'slide'
						&& this.browseTransitionDirection === 'prev',
					'menstrual-home__calendar-layer--fade-in': this.browseTransitionPhase === 'animating'
						&& this.browseTransitionEffect === 'fade'
				};
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
		// 小程序原生分享仍可通过右上角菜单触发，这里保持同一个 join 页目标
		onShareAppMessage() {
			return createInviteToken({
				apiBaseUrl: this.contractContext.apiBaseUrl,
				openid: this.contractContext.openid,
				moduleInstanceId: this.contractContext.moduleInstanceId,
			}).then((result) => {
				const path = createJoinPageUrl({
					apiBaseUrl: this.contractContext.apiBaseUrl,
					token: result?.data?.token
				}).replace(/^\//, '');

				return ({
				title: '邀请你查看经期小记',
				path,
				});
			}).catch((err) => {
				console.error('[onShareAppMessage] token 生成失败:', err);
				return { title: '经期小记' };
			});
		},
		onLoad(options) {
			const runtimeOptions = mergeH5RouteQuery(options || {});
			const d = v => v ? decodeURIComponent(v) : v;
			const openid = resolveRuntimeOpenid({
				explicitOpenid: d(runtimeOptions.openid),
				fallbackOpenid: DEFAULT_MENSTRUAL_HOME_CONTEXT.openid
			});
			this.contractContext = {
				...DEFAULT_MENSTRUAL_HOME_CONTEXT,
				apiBaseUrl: d(runtimeOptions.apiBaseUrl) || DEFAULT_MENSTRUAL_HOME_CONTEXT.apiBaseUrl,
				openid,
				moduleInstanceId: d(runtimeOptions.moduleInstanceId) || DEFAULT_MENSTRUAL_HOME_CONTEXT.moduleInstanceId,
				profileId: d(runtimeOptions.profileId) || DEFAULT_MENSTRUAL_HOME_CONTEXT.profileId,
				today: d(runtimeOptions.today) || DEFAULT_MENSTRUAL_HOME_CONTEXT.today
			};
			this.viewMode = this.resolveRememberedViewMode();
			this.activeDate = this.contractContext.today;
			this.focusDate = this.contractContext.today;
			this.retryInitialLoad();
		},
		onPageScroll() {
			this.clearCalendarInlineHint?.();
			this.$refs.calendarGrid?.invalidateCellRects?.();
		},
		methods: {
			resolveViewportWidth() {
				if (typeof uni !== 'undefined' && typeof uni.getWindowInfo === 'function') {
					return uni.getWindowInfo()?.windowWidth || 375;
				}
				if (typeof window !== 'undefined' && window.innerWidth) {
					return window.innerWidth;
				}
				return 375;
			},
			handleHomeRootTap() {
				this.clearCalendarInlineHint();
			},
			clearCalendarInlineHint() {
				if (this.calendarInlineHintTimer) {
					clearTimeout(this.calendarInlineHintTimer);
					this.calendarInlineHintTimer = null;
				}
				this.calendarInlineHintKey = '';
				this.calendarInlineHintMessage = '';
				this.calendarInlineHintAnchorRect = null;
			},
			showCalendarInlineHint(payload) {
				const hintKey = payload?.cell?.key || payload?.key || '';
				if (!hintKey) return;
				if (this.calendarInlineHintKey === hintKey) {
					this.clearCalendarInlineHint();
					return;
				}
				this.clearCalendarInlineHint();
				this.calendarInlineHintKey = hintKey;
				this.calendarInlineHintMessage = payload?.message || '';
				this.calendarInlineHintAnchorRect = payload?.anchorRect || null;
				this.calendarInlineHintTimer = setTimeout(() => {
					this.clearCalendarInlineHint();
				}, CALENDAR_INLINE_HINT_DURATION_MS);
			},
			handleBlockedFutureTap(payload) {
				this.showCalendarInlineHint(payload);
			},
			resolveRememberedViewMode() {
				if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
					return 'three-week';
				}
				const remembered = uni.getStorageSync(VIEW_MODE_STORAGE_KEY);
				return remembered === 'month' ? 'month' : 'three-week';
			},
			rememberViewMode(viewMode) {
				if (viewMode !== 'month' && viewMode !== 'three-week') return;
				if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') return;
				uni.setStorageSync(VIEW_MODE_STORAGE_KEY, viewMode);
			},
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
			rebuildLocalPage({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode, useCalendarWindow = true, dayDetail = null, selectedDateKey = this.selectedDateKey } = {}) {
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
					viewMode,
					selectedDateKey
				});
			},
			applyLocalBrowseState({ selectedDate = this.activeDate, focusDate = this.focusDate, viewMode = this.viewMode, useCalendarWindow = true, dayDetail = null, selectedDateKey = this.selectedDateKey } = {}) {
				this.activeDate = selectedDate;
				this.focusDate = focusDate;
				this.selectedDateKey = selectedDateKey;
				this.viewMode = viewMode;
				this.page = this.rebuildLocalPage({
					selectedDate,
					focusDate,
					viewMode,
					useCalendarWindow,
					dayDetail,
					selectedDateKey
				});
			},
			clearBrowseAnimationTimer() {
				if (this.browseAnimationTimer) {
					clearTimeout(this.browseAnimationTimer);
					this.browseAnimationTimer = null;
				}
			},
			clearBrowseMaskTimer() {
				if (this.browseMaskDelayTimer) {
					clearTimeout(this.browseMaskDelayTimer);
					this.browseMaskDelayTimer = null;
				}
				this.browseMaskShown = false;
			},
			scheduleBrowseMask() {
				this.clearBrowseMaskTimer();
				this.browseMaskDelayTimer = setTimeout(() => {
					this.browseMaskDelayTimer = null;
					if (this.browseTransitionPhase === 'preloading') {
						this.browseMaskShown = true;
					}
				}, BROWSE_MASK_DELAY_MS);
			},
			buildBrowsePayload({
				selectedDate,
				focusDate,
				viewMode,
				calendarWindow,
				dayDetail,
				singleDayPeriodAction
			}) {
				const nextRawContracts = {
					...this.rawContracts,
					calendarWindow,
					dayDetail,
					singleDayPeriodAction,
					focusDate,
					viewMode
				};

				return {
					pageModel: createMenstrualHomePageModel({
						homeView: nextRawContracts.homeView,
						moduleSettings: nextRawContracts.moduleSettings,
						calendarWindow,
						dayDetail,
						singleDayPeriodAction,
						today: this.contractContext.today,
						focusDate,
						viewMode,
						selectedDateKey: selectedDate
					}),
					rawContracts: nextRawContracts,
					activeDate: selectedDate,
					focusDate,
					viewMode
				};
			},
			async loadBrowseDependencies({ selectedDate, focusDate, viewMode, requestId }) {
				const [calendarResult, dayDetail, singleDayPeriodAction] = await Promise.all([
					loadMenstrualCalendarWindow({
						...this.contractContext,
						focusDate,
						viewMode
					}),
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

				if (requestId !== this.browseRequestId) {
					return null;
				}

				return this.buildBrowsePayload({
					selectedDate,
					focusDate,
					viewMode,
					calendarWindow: calendarResult.calendarWindow,
					dayDetail,
					singleDayPeriodAction
				});
			},
			startBrowseAnimation() {
				const requestId = this.browseRequestId;
				this.browseTransitionPhase = 'animating';
				this.clearBrowseMaskTimer();
				this.clearBrowseAnimationTimer();
				this.browseAnimationTimer = setTimeout(() => {
					this.commitBufferedBrowse(requestId);
				}, BROWSE_ANIMATION_MS);
			},
			commitBufferedBrowse(requestId = this.browseRequestId) {
				if (requestId !== this.browseRequestId || !this.pendingBrowsePayload) {
					return;
				}

				const pending = this.pendingBrowsePayload;
				this.page = pending.pageModel;
				this.rawContracts = pending.rawContracts;
				this.activeDate = pending.activeDate;
				this.focusDate = pending.focusDate;
				this.selectedDateKey = pending.pageModel?.selectedDateKey || pending.activeDate || null;
				this.viewMode = pending.viewMode;
				this.currentCalendarKey = this.pendingCalendarKey;
				this.pendingBrowsePayload = null;
				this.pendingCalendarKey = 0;
				this.browseTransitionPhase = 'idle';
				this.browseTransitionDirection = null;
				this.browseTransitionEffect = 'slide';
				this.clearBrowseAnimationTimer();
				this.clearBrowseMaskTimer();
			},
			resetBufferedBrowse() {
				this.pendingBrowsePayload = null;
				this.pendingCalendarKey = 0;
				this.browseTransitionPhase = 'idle';
				this.browseTransitionDirection = null;
				this.browseTransitionEffect = 'slide';
				this.clearBrowseAnimationTimer();
				this.clearBrowseMaskTimer();
			},
			async beginBufferedBrowse({
				selectedDate,
				focusDate,
				viewMode,
				direction = 'next',
				effect = 'slide'
			}) {
				if (!this.rawContracts?.homeView || !this.rawContracts?.moduleSettings) return;
				if (this.isNavigationBusy) return;

				const requestId = ++this.browseRequestId;
				this.loadError = '';
				this.panelMode = 'single-day';
				this.clearCalendarInlineHint?.();
				this.clearHeaderInlineMessage();
				this.browseTransitionPhase = 'preloading';
				this.browseTransitionDirection = direction;
				this.browseTransitionEffect = effect;
				this.selectedDateKey = null;
				this.page = this.rebuildLocalPage({
					selectedDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode,
					useCalendarWindow: true,
					selectedDateKey: null
				});
				this.scheduleBrowseMask();

				try {
					const pendingPayload = await this.loadBrowseDependencies({
						selectedDate,
						focusDate,
						viewMode,
						requestId
					});
					if (!pendingPayload || requestId !== this.browseRequestId) {
						return;
					}
					this.pendingBrowsePayload = pendingPayload;
					this.pendingCalendarKey = this.currentCalendarKey + 1;
					this.startBrowseAnimation();
				} catch (error) {
					if (requestId !== this.browseRequestId) {
						return;
					}
					this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
					this.resetBufferedBrowse();
				}
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
					selectedDateKey: this.selectedDateKey,
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
				this.selectedDateKey = result.page?.selectedDateKey || null;
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
						useCalendarWindow: true,
						selectedDateKey: this.selectedDateKey
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
						dayDetail,
						selectedDateKey: this.selectedDateKey
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
			invalidateBrowseCache(scopes) {
				invalidateMenstrualBrowseCacheByScopes({
					affectedScopes: scopes,
					moduleInstanceId: this.contractContext.moduleInstanceId,
					profileId: this.contractContext.profileId,
					activeDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode
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
				this.clearCalendarInlineHint?.();
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
				this.selectedDateKey = cell.isoDate;
				this.applyLocalBrowseState({
					selectedDate: cell.isoDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode,
					useCalendarWindow: true,
					dayDetail: this.getSelectedDayDetail(cell.isoDate),
					selectedDateKey: cell.isoDate
				});
				this.refreshSelectedDayDetail({
					selectedDate: cell.isoDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode
				}).catch(() => {});
			},
			handleViewModeChange(nextMode) {
				if (this.isNavigationBusy) return;
				if (!nextMode || nextMode === this.viewMode) return;
				this.clearCalendarInlineHint?.();
				this.rememberViewMode(nextMode);
				this.beginBufferedBrowse({
					selectedDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: nextMode,
					direction: 'next',
					effect: 'fade'
				});
			},
			handleHeaderPrev() {
				if (this.isNavigationBusy) return;
				this.clearCalendarInlineHint?.();
				const nextFocusDate = shiftFocusDate(this.focusDate, this.viewMode, -1);
				if (!nextFocusDate) return;
				this.beginBufferedBrowse({
					selectedDate: nextFocusDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode,
					direction: 'prev',
					effect: 'slide'
				});
			},
			handleHeaderNext() {
				if (this.isNavigationBusy) return;
				this.clearCalendarInlineHint?.();
				const nextFocusDate = shiftFocusDate(this.focusDate, this.viewMode, 1);
				if (!nextFocusDate) return;
				this.beginBufferedBrowse({
					selectedDate: nextFocusDate,
					focusDate: nextFocusDate,
					viewMode: this.viewMode,
					direction: 'next',
					effect: 'slide'
				});
			},
			handleCalendarSwipeLeft() {
				if (this.isBrowseBusy || this.panelMode === 'batch') return;
				this.handleHeaderNext();
			},
			handleCalendarSwipeRight() {
				if (this.isBrowseBusy || this.panelMode === 'batch') return;
				this.handleHeaderPrev();
			},
			handleJump(jumpKey) {
				if (this.isNavigationBusy) return;
				this.clearCalendarInlineHint?.();
				const headerNav = this.page?.headerNav || {};
				const targetDate = jumpKey === 'next-period'
					? headerNav.nextPeriodStart || null
					: jumpKey === 'prev-period'
						? headerNav.previousPeriodStart || null
					: resolveJumpTargetDate(this.rawContracts?.homeView, jumpKey, this.contractContext.today);
				if ((jumpKey === 'prev-period' || jumpKey === 'next-period') && (isJumpBoundary(headerNav, jumpKey) || !targetDate)) {
					this.showHeaderInlineMessage(resolveJumpBoundaryMessage(jumpKey), jumpKey);
					return;
				}
				if (!targetDate) return;
				this.beginBufferedBrowse({
					selectedDate: targetDate,
					focusDate: targetDate,
					viewMode: this.viewMode,
					direction: 'next',
					effect: 'fade'
				});
			},
			createEmptyBatchDraft() {
				return {
					isPeriod: true,
					flowLevel: null,
					painLevel: null,
					colorLevel: null
				};
			},
			clearHeaderInlineMessage() {
				if (this.headerInlineMessageTimer) {
					clearTimeout(this.headerInlineMessageTimer);
					this.headerInlineMessageTimer = null;
				}
				this.headerInlineMessage = '';
			},
			showHeaderInlineMessage(message, side = 'next') {
				this.clearHeaderInlineMessage();
				this.headerInlineMessage = message;
				this.headerInlineMessageSide = side;
				this.headerInlineMessageTimer = setTimeout(() => {
					this.headerInlineMessage = '';
					this.headerInlineMessageTimer = null;
				}, 1500);
			},
			enterBatchMode(startCell = null) {
				this.panelMode = 'batch';
				this.batchDraft = this.createEmptyBatchDraft();
				this.batchStartKey = startCell?.key || null;
				this.batchEndKey = startCell?.key || null;
				this.batchHoveredKey = startCell?.key || null;
				this.selectedDateKey = null;
				this.page = this.rebuildLocalPage({
					selectedDate: this.activeDate,
					focusDate: this.focusDate,
					viewMode: this.viewMode,
					useCalendarWindow: true,
					selectedDateKey: null
				});
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
					this.invalidateBrowseCache(affectedScopes);
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
					this.invalidateBrowseCache(affectedScopes);
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
					this.invalidateBrowseCache(affectedScopes);
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
				this.clearCalendarInlineHint?.();
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
				this.clearCalendarInlineHint?.();
				this.panelMode = 'single-day';
				this.batchStartKey = null;
				this.batchEndKey = null;
				this.batchHoveredKey = null;
				this.batchSelectedKeysState = [];
			},
			handleBatchToggleTap() {
				if (this.isBrowseBusy) return;
				this.clearCalendarInlineHint?.();
				this.enterBatchMode();
			},
			handleBatchSaveTap() {
				if (!this.selectedBatchKeys.length || this.isMutating) return;
				return this.applyBatchAction();
			},
			handleReportEntryTap() {
				if (!this.page?.reportEntryCard?.targetUrl) return;
				const query = [
					`apiBaseUrl=${encodeURIComponent(this.contractContext.apiBaseUrl)}`,
					`openid=${encodeURIComponent(this.contractContext.openid)}`,
					`moduleInstanceId=${encodeURIComponent(this.contractContext.moduleInstanceId)}`
				].join('&');
				uni.navigateTo({
					url: `${this.page.reportEntryCard.targetUrl}?${query}`
				});
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
					.filter((cell) => {
						if (cell.selectable === false) return false;
						if (this.viewMode === 'month' && cell.isoDate) {
							const focusMonth = this.focusDate.slice(0, 7);
							return cell.isoDate.startsWith(focusMonth);
						}
						return true;
					})
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
			// DEV ONLY: 复制邀请链接，避免 owner 直接打开接受页造成“分享自己”的误解。
			async handleOpenJoinPage() {
				try {
					const result = await createInviteToken({
						apiBaseUrl: this.contractContext.apiBaseUrl,
						openid: this.contractContext.openid,
						moduleInstanceId: this.contractContext.moduleInstanceId,
					});
					const url = createJoinPageUrl({
						apiBaseUrl: this.contractContext.apiBaseUrl,
						token: result?.data?.token
					});

					await new Promise((resolve, reject) => {
						uni.setClipboardData({
							data: url,
							success: resolve,
							fail: reject
						});
					});

					uni.showToast({ title: '邀请链接已复制', icon: 'none' });
				} catch (err) {
					console.error('[handleOpenJoinPage]', err);
					uni.showToast({ title: '共享邀请生成失败', icon: 'none' });
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
			getPhaseIconUrl(phase) {
				return PHASE_ICON_URL_MAP[phase] || PHASE_ICON_URL_MAP.经期;
			},
			getPhaseHintStateKey(phaseStatus) {
				if (!phaseStatus?.phase) return '';
				if (phaseStatus.phase === '黄体期') {
					return phaseStatus.isLutealLate ? '黄体期_前7天' : '黄体期_早段';
				}
				return phaseStatus.phase;
			},
			shouldShowPhaseHintIcon(phaseStatus) {
				const phaseHintStateKey = this.getPhaseHintStateKey(phaseStatus);
				return Boolean(PHASE_HINT_ICON_CONFIG[phaseHintStateKey]);
			},
			handlePhaseWarningTap() {
				uni.showModal({
					title: '提示',
					content: '当前预测基于较少记录，随着记录次数增加会更准确',
					showCancel: false,
					confirmText: '知道了'
				});
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

	.menstrual-home__hero--emphasis {
		background: #FFFCF6;
		border: 2rpx solid #EAD9B3;
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

	.menstrual-home__hero-empty-state {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		gap: 14rpx;
		width: 100%;
		padding: 4rpx 0;
	}

	.menstrual-home__hero-empty-icon {
		width: 88rpx;
		height: 88rpx;
		flex-shrink: 0;
	}

	.menstrual-home__hero-empty-copy-group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8rpx;
		min-width: 0;
	}

	.menstrual-home__hero-phase-row {
		display: inline-flex;
		align-items: center;
		gap: 32rpx;
		width: fit-content;
	}

	.menstrual-home__hero-phase-group {
		display: inline-flex;
		align-items: center;
		gap: 8rpx;
		min-width: 0;
	}

	.menstrual-home__hero-phase-group--emphasis {
		padding: 12rpx 24rpx;
		border-radius: 999rpx;
		background: #FCF4E6;
	}

	.menstrual-home__hero-phase-icon {
		width: 44rpx;
		height: 44rpx;
		flex-shrink: 0;
	}

	.menstrual-home__hero-phase-name {
		font-size: 34rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.menstrual-home__hero-phase-name--emphasis {
		color: #B79B67;
	}

	.menstrual-home__hero-phase-warning-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28rpx;
		height: 28rpx;
		border-radius: 999rpx;
		background: #F3EEE7;
		flex-shrink: 0;
	}

	.menstrual-home__hero-phase-warning-btn-label {
		font-size: 18rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-muted;
	}

	.menstrual-home__hero-hint-group {
		display: inline-flex;
		align-items: center;
		gap: 10rpx;
		min-width: 0;
	}

	.menstrual-home__hero-hint-icon {
		width: 28rpx;
		height: 28rpx;
		flex-shrink: 0;
	}

	.menstrual-home__hero-hint-text {
		font-size: 24rpx;
		line-height: 1.4;
		color: $text-secondary;
	}

	.menstrual-home__hero-hint-text--emphasis {
		color: #B79B67;
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

	.menstrual-home__hero-status-text--empty {
		font-size: 34rpx;
	}

	.menstrual-home__hero-empty-copy {
		font-size: 22rpx;
		line-height: 1.45;
		text-align: left;
		color: $text-secondary;
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

	.menstrual-home__calendar-inline-hint {
		position: fixed;
		z-index: 80;
		transform: translate(-50%, calc(-100% - 18rpx));
		max-width: calc(100vw - 72rpx);
		padding: 18rpx 28rpx;
		border-radius: 20rpx;
		background: $bg-subtle;
		border: 2rpx solid $border-subtle;
		box-shadow: 0 14rpx 36rpx rgba(139, 111, 99, 0.18);
		white-space: nowrap;
	}

	.menstrual-home__calendar-inline-hint-text {
		display: block;
		font-size: 23rpx;
		line-height: 1.2;
		font-weight: $font-weight-medium;
		color: $text-muted;
		white-space: nowrap;
		word-break: keep-all;
		writing-mode: horizontal-tb;
	}

	.menstrual-home__calendar-inline-hint-arrow {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 12rpx solid transparent;
		border-right: 12rpx solid transparent;
		border-top: 12rpx solid $bg-subtle;
	}

	.menstrual-home__jump-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12rpx;
	}

	.menstrual-home__jump-tabs {
		flex: 1;
		min-width: 0;
	}

	.menstrual-home__batch-actions {
		display: inline-flex;
		align-items: flex-end;
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

	.menstrual-home__calendar-stage {
		position: relative;
		display: grid;
		overflow: hidden;
	}

	.menstrual-home__calendar-layer {
		grid-area: 1 / 1;
		width: 100%;
		will-change: transform, opacity;
	}

	.menstrual-home__calendar-layer--current {
		z-index: 1;
	}

	.menstrual-home__calendar-layer--pending {
		z-index: 2;
	}

	.menstrual-home__calendar-mask {
		grid-area: 1 / 1;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(250, 247, 242, 0.58);
		backdrop-filter: blur(2px);
	}

	.menstrual-home__calendar-mask-label {
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: rgba(255, 255, 255, 0.9);
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}

	.menstrual-home__calendar-layer--slide-out-left {
		animation: menstrual-calendar-slide-out-left 200ms ease-out forwards;
	}

	.menstrual-home__calendar-layer--slide-out-right {
		animation: menstrual-calendar-slide-out-right 200ms ease-out forwards;
	}

	.menstrual-home__calendar-layer--slide-in-left {
		animation: menstrual-calendar-slide-in-left 200ms ease-out forwards;
	}

	.menstrual-home__calendar-layer--slide-in-right {
		animation: menstrual-calendar-slide-in-right 200ms ease-out forwards;
	}

	.menstrual-home__calendar-layer--fade-out {
		animation: menstrual-calendar-fade-out 200ms ease-out forwards;
	}

	.menstrual-home__calendar-layer--fade-in {
		animation: menstrual-calendar-fade-in 200ms ease-out forwards;
	}

	@keyframes menstrual-calendar-slide-out-left {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(-10%); opacity: 0; }
	}

	@keyframes menstrual-calendar-slide-out-right {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(10%); opacity: 0; }
	}

	@keyframes menstrual-calendar-slide-in-left {
		from { transform: translateX(12%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	@keyframes menstrual-calendar-slide-in-right {
		from { transform: translateX(-12%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	@keyframes menstrual-calendar-fade-out {
		from { opacity: 1; }
		to { opacity: 0; }
	}

	@keyframes menstrual-calendar-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
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

	.menstrual-home__report-entry {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		padding: 24rpx;
		border-radius: 28rpx;
		background: #fffdf9;
		border: 2rpx solid #ece1d5;
	}

	.menstrual-home__report-entry-copy {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		min-width: 0;
	}

	.menstrual-home__report-entry-title-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.menstrual-home__report-entry-title-icon {
		width: 36rpx;
		height: 36rpx;
		flex-shrink: 0;
		border-radius: 50%;
	}

	.menstrual-home__report-entry-title {
		font-size: 26rpx;
		line-height: 1.2;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.menstrual-home__report-entry-description {
		font-size: 22rpx;
		line-height: 1.5;
		color: $text-muted;
	}

	.menstrual-home__report-entry-icon {
		width: 88rpx;
		height: 88rpx;
		flex-shrink: 0;
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

	.menstrual-home__leave-btn {
		padding: 4px 12px;
		background: #fee2e2;
		border-radius: 8px;
		font-size: 13px;
		color: #dc2626;
	}
</style>
