<template>
	<view class="jump-tabs">
		<view
			v-for="item in items"
			:key="item.key"
			class="jump-tabs__item"
			:class="itemClasses(item)"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="onTap(item)"
		>
			<text class="jump-tabs__label" :class="labelClasses(item)">{{ item.label }}</text>
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
			}
		},
		emits: ['jump'],
		methods: {
			onTap(item) {
				if (this.busy) return;
				if (item.disabled) return;
				this.$emit('jump', item.key);
			},
			itemClasses(item) {
				return [
					`jump-tabs__item--${item.tone || 'outlined'}`,
					item.key === this.value ? 'jump-tabs__item--active' : '',
					item.disabled ? 'jump-tabs__item--disabled' : ''
				];
			},
			labelClasses(item) {
				return [
					`jump-tabs__label--${item.tone || 'outlined'}`,
					item.key === this.value ? 'jump-tabs__label--active' : '',
					item.disabled ? 'jump-tabs__label--disabled' : ''
				];
			}
		}
	};
</script>

<style lang="scss">
	.jump-tabs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		padding: 0 20rpx;
	}

	.jump-tabs__item {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 54rpx;
		padding: 12rpx 20rpx;
		border-radius: 999rpx;
		background: #f3eee7;
		border: 2rpx solid transparent;
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
</style>
