<template>
	<view class="selected-date-panel">
		<view class="selected-date-panel__head">
			<text class="selected-date-panel__title">{{ title }}</text>
			<text v-if="badge" class="selected-date-panel__badge">{{ badge }}</text>
		</view>

		<view v-if="chips.length" class="selected-date-panel__chip-row">
			<view
				v-for="chip in chips"
				:key="chip"
				class="selected-date-panel__chip"
				:class="{ 'selected-date-panel__chip--accent': chip === '经期' }"
			>
				<text class="selected-date-panel__chip-label">{{ chip }}</text>
			</view>
		</view>

		<view class="selected-date-panel__summary-row">
			<view
				v-for="item in summaryItems"
				:key="item.key"
				class="selected-date-panel__summary-item"
			>
				<text class="selected-date-panel__summary-label">{{ item.label }}</text>
				<text class="selected-date-panel__summary-value">{{ item.value }}</text>
			</view>
		</view>

		<view class="selected-date-panel__action">
			<text class="selected-date-panel__action-label">{{ actionLabel }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'SelectedDatePanel',
		props: {
			title: {
				type: String,
				required: true
			},
			badge: {
				type: String,
				default: ''
			},
			chips: {
				type: Array,
				default() {
					return [];
				}
			},
			summaryItems: {
				type: Array,
				default() {
					return [];
				}
			},
			actionLabel: {
				type: String,
				required: true
			}
		}
	};
</script>

<style lang="scss">
	.selected-date-panel {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
		padding: 32rpx;
		border-radius: 32rpx;
		background: #ffffff;
		box-shadow: 0 20rpx 44rpx rgba(47, 42, 38, 0.08);
	}

	.selected-date-panel__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
	}

	.selected-date-panel__title {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.selected-date-panel__badge {
		font-size: 22rpx;
		line-height: 1;
		color: #8e7c6d;
	}

	.selected-date-panel__chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.selected-date-panel__chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 52rpx;
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #f3eee7;
	}

	.selected-date-panel__chip--accent {
		background: #f3d7d1;
	}

	.selected-date-panel__chip-label {
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-secondary;
	}

	.selected-date-panel__summary-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 16rpx;
	}

	.selected-date-panel__summary-item {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		padding: 24rpx;
		border-radius: 28rpx;
		background: #f3eee7;
	}

	.selected-date-panel__summary-label {
		font-size: 20rpx;
		line-height: 1.2;
		color: #8e7c6d;
	}

	.selected-date-panel__summary-value {
		font-size: 22rpx;
		line-height: 1.3;
		font-weight: $font-weight-strong;
		color: $text-primary;
	}

	.selected-date-panel__action {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 72rpx;
		padding: 16rpx 24rpx;
		border-radius: 24rpx;
		background: $accent-period;
	}

	.selected-date-panel__action-label {
		font-size: 28rpx;
		line-height: 1;
		font-weight: $font-weight-strong;
		color: #ffffff;
	}
</style>
