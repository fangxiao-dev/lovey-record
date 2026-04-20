<template>
	<view
		class="calendar-grid"
		:class="rootClasses"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
		@touchcancel="onTouchCancel"
	>
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
		>
			<view
				v-if="weekIndex > 0"
				class="calendar-grid__divider"
				:class="{ 'calendar-grid__divider--month-boundary': weekBoundaryInfo[weekIndex].betweenRowBoundary }"
				aria-hidden="true"
			>
				<template v-if="weekBoundaryInfo[weekIndex].betweenRowBoundary">
					<view class="calendar-grid__boundary-slot calendar-grid__boundary-slot--between-row">
						<view class="calendar-grid__boundary-slot-box calendar-grid__boundary-slot-box--between-row">
							<view class="calendar-grid__month-chip calendar-grid__month-chip--between-row">
								<text>{{ formatBoundaryMonthNumber(weekBoundaryInfo[weekIndex].betweenRowNewMonth) }}</text>
								<text>月</text>
							</view>
						</view>
					</view>
				</template>
			</view>
			<view class="calendar-grid__cells">
				<!-- cells before the month boundary (or all 7 cells when no boundary) -->
				<view
					v-for="cell in weekCellsBefore(week, weekIndex)"
					:key="cell.key || cell.label"
					class="calendar-grid__cell"
					:class="{ 'calendar-grid__cell--tappable': interactive && cell.selectable !== false && !busy }"
					:hover-class="interactive && cell.selectable !== false && !busy ? 'ui-pressable-hover' : ''"
					:hover-stay-time="70"
					@tap.stop="onCellTap(cell)"
				>
					<DateCell :label="cell.label" :variant="effectiveVariant(cell)" />
					<text v-if="cell.caption" class="calendar-grid__cell-caption">
						{{ cell.caption }}
					</text>
				</view>
				<!-- boundary slot: real flex item so it takes space rather than overlaying cells -->
				<view
					v-if="weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex >= 0"
					class="calendar-grid__boundary-slot"
					aria-hidden="true"
				>
					<view class="calendar-grid__boundary-slot-box">
						<view class="calendar-grid__month-chip">
							<text>{{ formatBoundaryMonthNumber(weekBoundaryInfo[weekIndex].inRowNewMonth) }}</text>
							<text>月</text>
						</view>
					</view>
				</view>
				<!-- cells after the month boundary (empty when no boundary) -->
				<view
					v-for="cell in weekCellsAfter(week, weekIndex)"
					:key="cell.key || cell.label"
					class="calendar-grid__cell"
					:class="{ 'calendar-grid__cell--tappable': interactive && cell.selectable !== false && !busy }"
					:hover-class="interactive && cell.selectable !== false && !busy ? 'ui-pressable-hover' : ''"
					:hover-stay-time="70"
					@tap.stop="onCellTap(cell)"
				>
					<DateCell :label="cell.label" :variant="effectiveVariant(cell)" />
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

	/**
	 * Maps a base variant to its selected counterpart.
	 * selected = transient overlay; must not erase period/today/prediction meaning.
	 */
	const SELECT_VARIANT_MAP = Object.freeze({
		default: 'selected',
		futureMuted: 'futureMuted',
		futurePrediction: 'futurePrediction',
		futurePeriod: 'futurePeriod',
		today: 'selectedToday',
		detail: 'selectedDetail',
		prediction: 'selectedPrediction',
		predictionDetail: 'selectedPredictionDetail',
		period: 'selectedPeriod',
		periodDetail: 'selectedPeriodDetail',
		todayDetail: 'selectedTodayDetail',
		todayPeriod: 'selectedTodayPeriod',
		todayPeriodDetail: 'selectedTodayPeriodDetail',
		todayPredictionDetail: 'selectedTodayPredictionDetail',
		todayPrediction: 'selectedTodayPrediction'
	});

	const SELECT_VARIANT_REVERSE_MAP = Object.freeze(
		Object.fromEntries(
			Object.entries(SELECT_VARIANT_MAP).map(([baseVariant, selectedVariant]) => [selectedVariant, baseVariant])
		)
	);

	const LONG_PRESS_DELAY = 400; // ms
	const MOVE_CANCEL_THRESHOLD = 10; // px

	function normalizeVariant(variant) {
		return SELECT_VARIANT_REVERSE_MAP[variant] || variant;
	}

	function applyBatchPeriodPreview(variant, previewPeriodMarked) {
		const normalizedVariant = normalizeVariant(variant);

		if (previewPeriodMarked) {
			const previewToPeriodMap = {
				default: 'period',
				detail: 'periodDetail',
				prediction: 'period',
				predictionDetail: 'periodDetail',
				period: 'period',
				periodDetail: 'periodDetail',
				today: 'todayPeriod',
				todayDetail: 'todayPeriodDetail',
				todayPrediction: 'todayPeriod',
				todayPredictionDetail: 'todayPeriodDetail',
				todayPeriod: 'todayPeriod'
			};
			return previewToPeriodMap[normalizedVariant] || normalizedVariant;
		}

		const previewToDefaultMap = {
			default: 'default',
			detail: 'detail',
			prediction: 'prediction',
			predictionDetail: 'predictionDetail',
			period: 'default',
			periodDetail: 'detail',
			today: 'today',
			todayDetail: 'todayDetail',
			todayPeriodDetail: 'todayDetail',
			todayPrediction: 'todayPrediction',
			todayPredictionDetail: 'todayPredictionDetail',
			todayPeriod: 'today'
		};
		return previewToDefaultMap[normalizedVariant] || normalizedVariant;
	}

	function formatBoundaryMonthNumber(monthNumber) {
		if (!Number.isInteger(monthNumber) || monthNumber <= 0) {
			return '';
		}

		return String(monthNumber);
	}

	export default {
		name: 'CalendarGrid',
		components: {
			DateCell
		},
		watch: {
			weeks: {
				handler() {
					this.invalidateCellRects();
				}
			}
		},
		mounted() {
			this.bindDesktopLongPressEvents();
			this._invalidateRects = () => {
				this.invalidateCellRects();
			};
			// #ifdef H5
			window.addEventListener('scroll', this._invalidateRects, { passive: true });
			window.addEventListener('resize', this._invalidateRects, { passive: true });
			// #endif
		},
		beforeUnmount() {
			this.unbindDesktopLongPressEvents();
			// #ifdef H5
			window.removeEventListener('scroll', this._invalidateRects);
			window.removeEventListener('resize', this._invalidateRects);
			// #endif
			this._invalidateRects = null;
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
			},
			compact: {
				type: Boolean,
				default: false
			},
			/** Disable all tap and drag interactions (e.g. month-view browse mode) */
			interactive: {
				type: Boolean,
				default: true
			},
			/** Keys of cells currently in the batch selection range */
			selectedKeys: {
				type: Array,
				default() {
					return [];
				}
			},
			previewPeriodMarked: {
				type: Boolean,
				default: null
			},
			busy: {
				type: Boolean,
				default: false
			}
		},
		emits: ['cell-tap', 'batch-start', 'batch-extend', 'batch-end'],
		data() {
			return {
				batchMode: false,
				longPressTimer: null,
				longPressStartedAt: 0,
				touchStartX: 0,
				touchStartY: 0,
				cellRects: null,
				suppressTapUntil: 0,
				desktopRootEl: null,
				_invalidateRects: null,
				_boundMouseDown: null,
				_boundMouseMove: null,
				_boundMouseUp: null,
				_boundMouseLeave: null
			};
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
				return this.batchMode ? ['calendar-grid--batch-mode'] : [];
			},
			allCells() {
				return this.resolvedWeeks.flatMap((w) => w.cells);
			},
			weekBoundaryInfo() {
				return this.resolvedWeeks.map((week, weekIndex) => {
					let inRowBoundaryAfterIndex = -1;
					for (let i = 0; i < 6; i += 1) {
						const currentDate = week.cells[i]?.isoDate;
						const nextDate = week.cells[i + 1]?.isoDate;
						if (!currentDate || !nextDate) continue;

						const currentMonth = new Date(`${currentDate}T00:00:00Z`).getUTCMonth();
						const nextMonth = new Date(`${nextDate}T00:00:00Z`).getUTCMonth();
						if (currentMonth !== nextMonth) {
							inRowBoundaryAfterIndex = i;
							break;
						}
					}

					const inRowNewMonth = inRowBoundaryAfterIndex >= 0
						? new Date(`${week.cells[inRowBoundaryAfterIndex + 1].isoDate}T00:00:00Z`).getUTCMonth() + 1
						: null;

					const prevWeek = weekIndex > 0 ? this.resolvedWeeks[weekIndex - 1] : null;
					let betweenRowBoundary = false;
					let betweenRowNewMonth = null;

					if (prevWeek?.cells[6]?.isoDate && week.cells[0]?.isoDate) {
						const prevMonth = new Date(`${prevWeek.cells[6].isoDate}T00:00:00Z`).getUTCMonth();
						const currentMonth = new Date(`${week.cells[0].isoDate}T00:00:00Z`).getUTCMonth();
						if (prevMonth !== currentMonth) {
							betweenRowBoundary = true;
							betweenRowNewMonth = currentMonth + 1;
						}
					}

					return {
						inRowBoundaryAfterIndex,
						inRowNewMonth,
						betweenRowBoundary,
						betweenRowNewMonth
					};
				});
			}
		},
		methods: {
			formatBoundaryMonthNumber,

			/** Returns cells before the month boundary (or all 7 when no boundary). */
			weekCellsBefore(week, weekIndex) {
				const idx = this.weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex;
				return idx >= 0 ? week.cells.slice(0, idx + 1) : week.cells;
			},

			/** Returns cells after the month boundary (empty array when no boundary). */
			weekCellsAfter(week, weekIndex) {
				const idx = this.weekBoundaryInfo[weekIndex].inRowBoundaryAfterIndex;
				return idx >= 0 ? week.cells.slice(idx + 1) : [];
			},

			effectiveVariant(cell) {
				if (this.selectedKeys.includes(cell.key)) {
					const previewVariant = this.previewPeriodMarked === null
						? normalizeVariant(cell.variant)
						: applyBatchPeriodPreview(cell.variant, this.previewPeriodMarked);
					return SELECT_VARIANT_MAP[previewVariant] || previewVariant;
				}
				return cell.variant;
			},

			onCellTap(cell) {
				if (this.busy) return;
				if (!this.interactive) return;
				if (cell.selectable === false) return;
				if (Date.now() < this.suppressTapUntil) return;
				if (this.batchMode) return;
				this.$emit('cell-tap', cell);
			},

			bindDesktopLongPressEvents() {
				const root = this.$el;
				if (!root || typeof root.addEventListener !== 'function') return;
				this.desktopRootEl = root;
				this._boundMouseDown = this.onMouseDown.bind(this);
				this._boundMouseMove = this.onMouseMove.bind(this);
				this._boundMouseUp = this.onMouseUp.bind(this);
				this._boundMouseLeave = this.onMouseLeave.bind(this);
				root.addEventListener('mousedown', this._boundMouseDown);
				root.addEventListener('mousemove', this._boundMouseMove);
				root.addEventListener('mouseup', this._boundMouseUp);
				root.addEventListener('mouseleave', this._boundMouseLeave);
			},

			unbindDesktopLongPressEvents() {
				const root = this.desktopRootEl;
				if (!root || typeof root.removeEventListener !== 'function') return;
				root.removeEventListener('mousedown', this._boundMouseDown);
				root.removeEventListener('mousemove', this._boundMouseMove);
				root.removeEventListener('mouseup', this._boundMouseUp);
				root.removeEventListener('mouseleave', this._boundMouseLeave);
				this.desktopRootEl = null;
				this._boundMouseDown = null;
				this._boundMouseMove = null;
				this._boundMouseUp = null;
				this._boundMouseLeave = null;
			},

			onMouseDown(e) {
				if (!this.interactive) return;
				if (e.button !== 0) return;
				this.beginLongPress(e.clientX, e.clientY);
			},

			onMouseMove(e) {
				if (!this.interactive) return;
				this.handlePointerMove(e.clientX, e.clientY, e);
			},

			onMouseUp() {
				this.finishLongPress();
			},

			onMouseLeave() {
				this.finishLongPress();
			},

			onTouchStart(e) {
				if (this.busy) return;
				if (!this.interactive) return;
				const touch = e.touches[0];
				this.beginLongPress(touch.clientX, touch.clientY);
			},

			onTouchMove(e) {
				if (this.busy) return;
				if (!this.interactive) return;
				const touch = e.touches[0];
				this.handlePointerMove(touch.clientX, touch.clientY, e);
			},

			onTouchEnd() {
				if (this.busy) return;
				this.finishLongPress();
			},

			onTouchCancel() {
				if (this.busy) return;
				this.finishLongPress();
			},

			beginLongPress(clientX, clientY) {
				this.touchStartX = clientX;
				this.touchStartY = clientY;
				this.longPressStartedAt = Date.now();
				if (this.longPressTimer) {
					clearTimeout(this.longPressTimer);
				}
				this.longPressTimer = setTimeout(() => {
					this.longPressTimer = null;
					this.startBatchMode(this.touchStartX, this.touchStartY);
				}, LONG_PRESS_DELAY);
			},

			handlePointerMove(clientX, clientY, e) {
				const dx = clientX - this.touchStartX;
				const dy = clientY - this.touchStartY;

				if (this.longPressTimer) {
					if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
						clearTimeout(this.longPressTimer);
						this.longPressTimer = null;
					}
					return;
				}

				if (this.batchMode) {
					if (typeof e?.preventDefault === 'function') {
						e.preventDefault();
					}
					const idx = this.hitTestCell(clientX, clientY);
					if (idx !== -1) {
						const cell = this.allCells[idx];
						if (cell.selectable !== false) {
							this.$emit('batch-extend', cell);
						}
					}
				}
			},

			finishLongPress() {
				const holdElapsed = this.longPressStartedAt ? Date.now() - this.longPressStartedAt : 0;
				if (this.longPressTimer) {
					clearTimeout(this.longPressTimer);
					this.longPressTimer = null;
					if (holdElapsed >= LONG_PRESS_DELAY) {
						this.startBatchMode(this.touchStartX, this.touchStartY);
						return;
					}
				}
				if (this.batchMode) {
					this.batchMode = false;
					this.$emit('batch-end');
				}
				this.longPressStartedAt = 0;
			},

			captureCellRectsFromDom() {
				if (!this.desktopRootEl || typeof this.desktopRootEl.querySelectorAll !== 'function') {
					return [];
				}

				return [...this.desktopRootEl.querySelectorAll('.calendar-grid__cell')].map((node) => {
					const rect = node.getBoundingClientRect();
					return {
						left: rect.left,
						right: rect.right,
						top: rect.top,
						bottom: rect.bottom
					};
				});
			},
			invalidateCellRects() {
				this.cellRects = null;
			},
			captureCellRects(onReady) {
				if (this.cellRects && this.cellRects.length > 0) {
					onReady(this.cellRects);
					return true;
				}

				const fallbackRects = this.captureCellRectsFromDom();
				if (fallbackRects.length > 0) {
					this.cellRects = fallbackRects;
					onReady(fallbackRects);
					return true;
				}

				const query = uni.createSelectorQuery().in(this);
				query.selectAll('.calendar-grid__cell').boundingClientRect((rects) => {
					if (!rects || rects.length === 0) return;
					this.cellRects = rects;
					onReady(rects);
				});
				query.exec();
				return false;
			},

			startBatchMode(x, y) {
				this.captureCellRects(() => {
					const idx = this.hitTestCell(x, y);
					if (idx !== -1) {
						const cell = this.allCells[idx];
						if (cell.selectable !== false) {
							this.batchMode = true;
							this.suppressTapUntil = Date.now() + 500;
							this.longPressStartedAt = 0;
							this.$emit('batch-start', cell);
							return;
						}
					}
				});
			},

			hitTestCell(x, y) {
				if (!this.cellRects) return -1;
				for (let i = 0; i < this.cellRects.length; i++) {
					const r = this.cellRects[i];
					if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
						return i;
					}
				}
				return -1;
			}
		}
	};
</script>

<style lang="scss">
	.calendar-grid {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding: 16rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.calendar-grid__weekday-row {
		display: flex;
		align-items: center;
		justify-content: space-around;
	}

	.calendar-grid__weekday {
		text-align: center;
		font-family: $font-family-body;
		font-size: 22rpx;
		line-height: 22rpx;
		font-weight: $font-weight-semibold;
		color: $text-muted;
		width: 90rpx;
	}

	.calendar-grid__week {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}

	.calendar-grid__divider {
		height: 1px;
		background: $calendar-week-divider;
	}

	.calendar-grid__cells {
		/*
		 * Flex row so the boundary-slot chip is a real layout participant.
		 * Each cell gets flex:1 (equal share of remaining space after chip).
		 * This ensures chip and cells never overlap — no absolute positioning tricks.
		 */
		display: flex;
		flex-direction: row;
		gap: 8rpx;
		align-items: stretch;
	}

	.calendar-grid__cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0;
		min-height: 90rpx;
		min-width: 0;
		overflow: visible;
	}

	.calendar-grid__cell--tappable {
		cursor: pointer;
	}

	/* Boundary slot: chip + divider as a real flex item between the two cell groups */
	.calendar-grid__boundary-slot {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		padding: 0 4rpx;
		min-width: 28rpx;
	}

	.calendar-grid__boundary-slot--between-row {
		align-self: auto;
		padding: 0;
		min-width: 0;
	}

	.calendar-grid__boundary-slot-box {
		height: 100%;
		padding: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
	}

	.calendar-grid__boundary-slot-box--between-row {
		height: auto;
	}

	.calendar-grid__cell-caption {
		display: block;
		font-family: $font-family-body;
		font-size: 20rpx;
		line-height: 1;
		color: $text-muted;
		text-align: center;
	}

	.calendar-grid__month-chip {
		background: $bg-subtle;
		color: $text-muted;
		font-size: 16rpx;
		font-weight: $font-weight-semibold;
		padding: 4rpx 6rpx;
		border-radius: 6rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		line-height: 1.1;
		pointer-events: none;
		z-index: 2;
	}

	.calendar-grid__month-chip--between-row {
		align-self: flex-start;
	}

	.calendar-grid__divider--month-boundary {
		min-height: 12rpx;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
