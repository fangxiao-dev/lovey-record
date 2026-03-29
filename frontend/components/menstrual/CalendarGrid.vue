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
			<view v-if="weekIndex > 0" class="calendar-grid__divider" aria-hidden="true"></view>
			<view class="calendar-grid__cells">
				<view
					v-for="cell in week.cells"
					:key="cell.key || cell.label"
					class="calendar-grid__cell"
					:class="{ 'calendar-grid__cell--tappable': interactive && cell.selectable !== false }"
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
		today: 'selectedToday',
		detail: 'selectedDetail',
		prediction: 'selectedPrediction',
		predictionDetail: 'selectedPredictionDetail',
		period: 'selectedPeriod',
		periodDetail: 'selectedPeriodDetail',
		todayDetail: 'selectedTodayDetail',
		todayPeriod: 'selectedTodayPeriod',
		todayPrediction: 'selectedTodayPrediction'
	});

	const LONG_PRESS_DELAY = 400; // ms
	const MOVE_CANCEL_THRESHOLD = 10; // px

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
			}
		},
		emits: ['cell-tap', 'batch-start', 'batch-extend', 'batch-end'],
		data() {
			return {
				batchMode: false,
				longPressTimer: null,
				touchStartX: 0,
				touchStartY: 0,
				cellRects: null
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
			}
		},
		methods: {
			effectiveVariant(cell) {
				if (this.selectedKeys.includes(cell.key)) {
					return SELECT_VARIANT_MAP[cell.variant] || cell.variant;
				}
				return cell.variant;
			},

			onCellTap(cell) {
				if (!this.interactive) return;
				if (cell.selectable === false) return;
				if (this.batchMode) return;
				this.$emit('cell-tap', cell);
			},

			onTouchStart(e) {
				if (!this.interactive) return;
				const touch = e.touches[0];
				this.touchStartX = touch.clientX;
				this.touchStartY = touch.clientY;
				this.cellRects = null;

				this.longPressTimer = setTimeout(() => {
					this.longPressTimer = null;
					this.startBatchMode(this.touchStartX, this.touchStartY);
				}, LONG_PRESS_DELAY);
			},

			onTouchMove(e) {
				if (!this.interactive) return;
				const touch = e.touches[0];
				const dx = touch.clientX - this.touchStartX;
				const dy = touch.clientY - this.touchStartY;

				if (this.longPressTimer) {
					// Cancel long press if user has moved significantly
					if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
						clearTimeout(this.longPressTimer);
						this.longPressTimer = null;
					}
					return;
				}

				if (this.batchMode) {
					// Prevent page scroll during batch drag
					// Note: in mini-program environment this may require catchTouchMove instead
					if (typeof e.preventDefault === 'function') {
						e.preventDefault();
					}
					const idx = this.hitTestCell(touch.clientX, touch.clientY);
					if (idx !== -1) {
						const cell = this.allCells[idx];
						if (cell.selectable !== false) {
							this.$emit('batch-extend', cell);
						}
					}
				}
			},

			onTouchEnd() {
				if (this.longPressTimer) {
					clearTimeout(this.longPressTimer);
					this.longPressTimer = null;
				}
				if (this.batchMode) {
					this.batchMode = false;
					this.$emit('batch-end');
				}
			},

			onTouchCancel() {
				if (this.longPressTimer) {
					clearTimeout(this.longPressTimer);
					this.longPressTimer = null;
				}
				if (this.batchMode) {
					this.batchMode = false;
					this.$emit('batch-end');
				}
			},

			startBatchMode(x, y) {
				// Query all cell bounding rects for hit testing
				const query = uni.createSelectorQuery().in(this);
				query.selectAll('.calendar-grid__cell').boundingClientRect((rects) => {
					if (!rects || rects.length === 0) return;
					this.cellRects = rects;
					const idx = this.hitTestCell(x, y);
					if (idx === -1) return;
					const cell = this.allCells[idx];
					if (cell.selectable === false) return;
					this.batchMode = true;
					this.$emit('batch-start', cell);
				});
				query.exec();
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
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: 8rpx;
		row-gap: 12rpx;
		justify-items: center;
	}

	.calendar-grid__cell {
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

	.calendar-grid__cell-caption {
		display: block;
		font-family: $font-family-body;
		font-size: 20rpx;
		line-height: 1;
		color: $text-muted;
		text-align: center;
	}
</style>
