<template>
	<view class="segmented-control">
		<view
			v-for="option in options"
			:key="option.key"
			class="segmented-control__option"
			:class="{ 'segmented-control__option--active': option.key === value }"
			hover-class="ui-pressable-hover"
			:hover-stay-time="70"
			@tap="handleTap(option.key)"
		>
			<text
				class="segmented-control__label"
				:class="{ 'segmented-control__label--active': option.key === value }"
			>
				{{ option.label }}
			</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'SegmentedControl',
		props: {
			options: {
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
		emits: ['change'],
		methods: {
			handleTap(optionKey) {
				if (this.busy) return;
				this.$emit('change', optionKey);
			}
		}
	};
</script>

<style lang="scss">
	.segmented-control {
		display: flex;
		align-items: stretch;
		gap: 8rpx;
		padding: 8rpx;
		border-radius: 24rpx;
		background: #f3eee7;
	}

	.segmented-control__option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60rpx;
		padding: 12rpx 0;
		border-radius: 20rpx;
	}

	.segmented-control__option--active {
		background: #ffffff;
	}

	.segmented-control__label {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: #72685f;
	}

	.segmented-control__label--active {
		font-weight: $font-weight-strong;
		color: $text-primary;
	}
</style>
