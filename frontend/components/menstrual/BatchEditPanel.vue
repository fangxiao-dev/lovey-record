<template>
	<view class="batch-edit-panel">
		<view class="batch-edit-panel__head">
			<text class="batch-edit-panel__title">批量补录</text>
			<text class="batch-edit-panel__range">{{ rangeLabel }}</text>
		</view>

		<view class="batch-edit-panel__chips">
			<view
				class="batch-edit-panel__chip batch-edit-panel__chip--set-period"
				:class="{ 'batch-edit-panel__chip--active': activeAction === 'set-period' }"
				@tap="$emit('action-change', 'set-period')"
			>
				<text class="batch-edit-panel__chip-label">设为经期</text>
			</view>
			<view
				class="batch-edit-panel__chip batch-edit-panel__chip--clear"
				:class="{ 'batch-edit-panel__chip--active': activeAction === 'clear-record' }"
				@tap="$emit('action-change', 'clear-record')"
			>
				<text class="batch-edit-panel__chip-label">清除记录</text>
			</view>
		</view>

		<view class="batch-edit-panel__actions">
			<view class="batch-edit-panel__btn batch-edit-panel__btn--cancel" @tap="$emit('cancel')">
				<text class="batch-edit-panel__btn-label">取消</text>
			</view>
			<view
				class="batch-edit-panel__btn batch-edit-panel__btn--apply"
				:class="{ 'batch-edit-panel__btn--apply-disabled': !activeAction }"
				@tap="onApply"
			>
				<text class="batch-edit-panel__btn-label batch-edit-panel__btn-label--apply">应用到区间</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'BatchEditPanel',
		props: {
			/** Display label for the start of the selection range, e.g. "03/18" */
			startLabel: {
				type: String,
				default: ''
			},
			/** Display label for the end of the selection range, e.g. "03/22" */
			endLabel: {
				type: String,
				default: ''
			},
			/** Currently active action chip: 'set-period' | 'clear-record' | null */
			activeAction: {
				type: String,
				default: null
			}
		},
		emits: ['action-change', 'cancel', 'apply'],
		computed: {
			rangeLabel() {
				if (!this.startLabel && !this.endLabel) return '';
				if (this.startLabel === this.endLabel) return this.startLabel;
				return `${this.startLabel} - ${this.endLabel}`;
			}
		},
		methods: {
			onApply() {
				if (!this.activeAction) return;
				this.$emit('apply');
			}
		}
	};
</script>

<style lang="scss">
	.batch-edit-panel {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding: 32rpx;
		border-radius: 32rpx;
		background: #ffffff;
	}

	.batch-edit-panel__head {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.batch-edit-panel__title {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.batch-edit-panel__range {
		font-size: 22rpx;
		line-height: 1;
		color: $text-secondary;
	}

	.batch-edit-panel__chips {
		display: flex;
		gap: 16rpx;
	}

	.batch-edit-panel__chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 64rpx;
		padding: 14rpx 24rpx;
		border-radius: 999rpx;
		border: 2rpx solid transparent;
		cursor: pointer;
		transition: box-shadow 0.15s;
	}

	.batch-edit-panel__chip--set-period {
		background: $accent-period-soft;
	}

	.batch-edit-panel__chip--clear {
		background: #f3eee7;
	}

	.batch-edit-panel__chip--active {
		border-color: #8e7c6d;
		box-shadow: 0 8rpx 8rpx rgba(47, 42, 38, 0.18);
	}

	.batch-edit-panel__chip-label {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.batch-edit-panel__actions {
		display: flex;
		gap: 16rpx;
	}

	.batch-edit-panel__btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80rpx;
		border-radius: 24rpx;
		cursor: pointer;
	}

	.batch-edit-panel__btn--cancel {
		background: #f3eee7;
	}

	.batch-edit-panel__btn--apply {
		background: $accent-period;
	}

	.batch-edit-panel__btn--apply-disabled {
		opacity: 0.38;
	}

	.batch-edit-panel__btn-label {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-secondary;
	}

	.batch-edit-panel__btn-label--apply {
		color: $accent-period-contrast;
	}
</style>
