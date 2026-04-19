<template>
	<view class="jump-tabs">
		<!-- 左区：_sep 之前的普通 chip -->
		<view class="jump-tabs__group">
			<view
				v-for="item in beforeSep"
				:key="item.key"
				class="jump-tabs__item"
				:class="itemClasses(item)"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="onTap(item)"
			>
				<text class="jump-tabs__label" :class="labelClasses(item)">{{ item.label }}</text>
				<view
					v-if="inlineMessage && inlineMessageKey === item.key"
					class="jump-tabs__bubble"
					:class="{
						'jump-tabs__bubble--prev': item.key === 'prev-period',
						'jump-tabs__bubble--next': item.key === 'next-period'
					}"
					@tap.stop="handleCloseMessage"
				>
					<text class="jump-tabs__bubble-text">{{ inlineMessage }}</text>
					<view class="jump-tabs__bubble-arrow"></view>
				</view>
			</view>
		</view>

		<!-- 中区：_sep 分组（label 在上，chip 在下） -->
		<view v-if="sepItem" class="jump-tabs__period-group">
			<text class="jump-tabs__section-label">{{ sepItem.label }}</text>
			<view class="jump-tabs__group">
				<view
					v-for="item in afterSep"
					:key="item.key"
					class="jump-tabs__item"
					:class="itemClasses(item)"
					hover-class="ui-pressable-hover"
					:hover-stay-time="70"
					@tap="onTap(item)"
				>
					<text class="jump-tabs__label" :class="labelClasses(item)">{{ item.label }}</text>
					<view
						v-if="inlineMessage && inlineMessageKey === item.key"
						class="jump-tabs__bubble"
						:class="{
							'jump-tabs__bubble--prev': item.key === 'prev-period',
							'jump-tabs__bubble--next': item.key === 'next-period'
						}"
						@tap.stop="handleCloseMessage"
					>
						<text class="jump-tabs__bubble-text">{{ inlineMessage }}</text>
						<view class="jump-tabs__bubble-arrow"></view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'JumpTabs',
		props: {
			items: {
				type: Array,
				required: true
			},
			value: {
				type: String,
				default: ''
			},
			busy: {
				type: Boolean,
				default: false
			},
			inlineMessage: {
				type: String,
				default: ''
			},
			inlineMessageKey: {
				type: String,
				default: ''
			}
		},
		emits: ['jump', 'close-message'],
		computed: {
			sepIndex() {
				return this.items.findIndex((item) => item.type === 'label');
			},
			sepItem() {
				return this.sepIndex !== -1 ? this.items[this.sepIndex] : null;
			},
			beforeSep() {
				return this.sepIndex !== -1 ? this.items.slice(0, this.sepIndex) : this.items;
			},
			afterSep() {
				return this.sepIndex !== -1 ? this.items.slice(this.sepIndex + 1) : [];
			}
		},
		methods: {
			onTap(item) {
				if (this.busy) return;
				if (item.disabled && !item.invalid) return;
				this.$emit('jump', item.key);
			},
			handleCloseMessage() {
				this.$emit('close-message');
			},
			itemClasses(item) {
				return [
					`jump-tabs__item--${item.tone || 'outlined'}`,
					item.key === this.value ? 'jump-tabs__item--active' : '',
					item.disabled ? 'jump-tabs__item--disabled' : '',
					item.invalid ? 'jump-tabs__item--invalid' : ''
				];
			},
			labelClasses(item) {
				return [
					`jump-tabs__label--${item.tone || 'outlined'}`,
					item.key === this.value ? 'jump-tabs__label--active' : '',
					item.disabled ? 'jump-tabs__label--disabled' : '',
					item.invalid ? 'jump-tabs__label--invalid' : ''
				];
			}
		}
	};
</script>

<style lang="scss">
	.jump-tabs {
		display: flex;
		align-items: flex-end;
		gap: 12rpx;
		padding: 0 20rpx;
	}

	.jump-tabs__group {
		display: inline-flex;
		align-items: flex-end;
		gap: 10rpx;
	}

	.jump-tabs__period-group {
		display: inline-flex;
		position: relative;
		flex-direction: column;
		align-items: center;
		gap: 0;
		justify-content: flex-end;
		padding-top: 32rpx;
	}

	.jump-tabs__item {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 54rpx;
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #f3eee7;
		border: 2rpx solid transparent;
		transition: opacity $motion-hover-duration $motion-ease-default;
	}

	.jump-tabs__item--outlined {
		border-color: #8e7c6d;
	}

	.jump-tabs__item--accent {
		background: $accent-period;
	}

	.jump-tabs__item--soft {
		background: #f3d7d1;
	}

	.jump-tabs__item--muted {
		background: #ffffff;
		border-color: #d8cec3;
	}

	.jump-tabs__label {
		font-size: 22rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: #72685f;
	}

	.jump-tabs__label--accent,
	.jump-tabs__label--active.jump-tabs__label--accent {
		color: #ffffff;
	}

	.jump-tabs__label--muted {
		color: #8e7c6d;
	}

	.jump-tabs__item--disabled {
		opacity: 0.38;
	}

	.jump-tabs__item--invalid {
		background: #f7f3ee;
		border-color: #ddd2c6;
	}

	.jump-tabs__label--invalid {
		color: $text-muted;
	}

	.jump-tabs__section-label {
		position: absolute;
		top: 2rpx;
		left: 50%;
		transform: translateX(-50%);
		font-size: 18rpx;
		line-height: 1;
		color: $text-muted;
		opacity: 0.82;
		letter-spacing: 1rpx;
		white-space: nowrap;
	}

	.jump-tabs__bubble {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 22rpx);
		transform: translateX(-50%);
		background: $bg-subtle;
		border-radius: 20rpx;
		padding: 18rpx 28rpx;
		min-height: 62rpx;
		pointer-events: auto;
		z-index: 30;
		white-space: nowrap;
		border: 2rpx solid $border-subtle;
		box-shadow: 0 14rpx 36rpx rgba(139, 111, 99, 0.18);
	}

	.jump-tabs__bubble--prev {
		transform: translateX(-78%);
	}

	.jump-tabs__bubble--next {
		transform: translateX(-22%);
	}

	.jump-tabs__bubble-text {
		display: block;
		font-size: 23rpx;
		line-height: 1.2;
		font-weight: $font-weight-medium;
		color: $text-muted;
		white-space: nowrap;
		word-break: keep-all;
		writing-mode: horizontal-tb;
	}

	.jump-tabs__bubble-arrow {
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

	.jump-tabs__bubble--prev .jump-tabs__bubble-arrow {
		left: 72%;
	}

	.jump-tabs__bubble--next .jump-tabs__bubble-arrow {
		left: 28%;
	}
</style>
