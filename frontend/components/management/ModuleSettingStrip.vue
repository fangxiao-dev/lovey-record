<template>
	<view
		class="module-setting-strip"
		:class="`module-setting-strip--${resolvedPickerAlign}`"
	>
		<view
			class="module-setting-strip__label-row"
			:class="`module-setting-strip__label-row--${resolvedPickerAlign}`"
		>
			<text class="module-setting-strip__label u-text-caption">{{ label }}</text>
		</view>

		<view
			class="module-setting-strip__control-group"
			:class="`module-setting-strip__control-group--${resolvedPickerAlign}`"
		>
			<view class="module-setting-strip__quick-row">
				<view
					v-for="option in options"
					:key="option.value"
					class="module-setting-strip__chip"
					:class="{ 'module-setting-strip__chip--selected': option.selected }"
					hover-class="ui-pressable-hover"
					:hover-stay-time="70"
					@tap="$emit('select', option.value)"
				>
					<text class="module-setting-strip__chip-text" :class="{ 'module-setting-strip__chip-text--selected': option.selected }">
						{{ option.label }}
					</text>
				</view>

				<view
					class="module-setting-strip__chip module-setting-strip__chip--custom"
					:class="{ 'module-setting-strip__chip--selected': customPickerVisible }"
					hover-class="ui-pressable-hover"
					:hover-stay-time="70"
					@tap="$emit('custom')"
				>
					<text
						class="module-setting-strip__chip-text module-setting-strip__chip-text--custom"
						:class="{ 'module-setting-strip__chip-text--selected': customPickerVisible }"
					>
						{{ customLabel }}
					</text>
				</view>
			</view>

			<view
				v-if="customPickerVisible"
				class="module-setting-strip__picker-card"
			>
				<view class="module-setting-strip__wheel-shell">
					<view class="module-setting-strip__wheel-indicator"></view>
					<view class="module-setting-strip__wheel-track">
						<view
							v-for="option in visibleWheelOptions"
							:key="option.slotKey"
							class="module-setting-strip__picker-item"
							:class="{ 'module-setting-strip__picker-item--selected': option.selected }"
							hover-class="ui-pressable-hover"
							:hover-stay-time="70"
							@tap="handleWheelOptionSelect(option)"
						>
							<text
								class="module-setting-strip__picker-text"
								:class="{ 'module-setting-strip__picker-text--selected': option.selected }"
							>
								{{ option.label }}
							</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ModuleSettingStrip',
		emits: ['select', 'custom', 'custom-change'],
		props: {
			label: {
				type: String,
				required: true
			},
			options: {
				type: Array,
				default: () => []
			},
			customLabel: {
				type: String,
				default: '自定义'
			},
			customPickerVisible: {
				type: Boolean,
				default: false
			},
			customPickerOptions: {
				type: Array,
				default: () => []
			},
			customPickerValueIndex: {
				type: Number,
				default: 0
			},
			pickerAlign: {
				type: String,
				default: 'start'
			}
		},
		computed: {
			resolvedPickerIndex() {
				if (!this.customPickerOptions.length) {
					return 0;
				}

				return Math.min(
					Math.max(this.customPickerValueIndex, 0),
					this.customPickerOptions.length - 1
				);
			},
			resolvedPickerAlign() {
				return this.pickerAlign === 'end' ? 'end' : 'start';
			},
			visibleWheelOptions() {
				const options = this.customPickerOptions || [];

				if (!options.length) {
					return [];
				}

				const visibleCount = Math.min(5, options.length);
				const maxStart = Math.max(options.length - visibleCount, 0);
				const centeredStart = this.resolvedPickerIndex - Math.floor(visibleCount / 2);
				const start = Math.min(Math.max(centeredStart, 0), maxStart);

				return options.slice(start, start + visibleCount).map((option) => ({
					...option,
					selected: option.value === options[this.resolvedPickerIndex]?.value,
					slotKey: `${option.value}-${start}`
				}));
			}
		},
		methods: {
			handleWheelOptionSelect(option) {
				if (!option || option.selected) return;

				this.$emit('custom-change', {
					value: option.value,
					index: this.customPickerOptions.findIndex((item) => item.value === option.value)
				});
			}
		}
	};
</script>

<style lang="scss">
	.module-setting-strip {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.module-setting-strip__label-row {
		display: flex;
		align-items: center;
	}

	.module-setting-strip__label-row--start {
		justify-content: flex-start;
	}

	.module-setting-strip__label-row--end {
		justify-content: flex-end;
	}

	.module-setting-strip__label {
		color: $text-secondary;
	}

	.module-setting-strip__quick-row {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 8rpx;
		width: fit-content;
		max-width: 100%;
	}

	.module-setting-strip__control-group {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		width: fit-content;
		max-width: 100%;
	}

	.module-setting-strip__control-group--start {
		align-self: flex-start;
	}

	.module-setting-strip__control-group--end {
		align-self: flex-end;
	}

	.module-setting-strip__chip {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		min-height: 56rpx;
		padding: 0 18rpx;
		border-radius: 999rpx;
		border: 2rpx solid transparent;
		background: $bg-subtle;
		box-sizing: border-box;
	}

	.module-setting-strip__chip--selected {
		background: $accent-period-soft;
		border-color: $accent-period;
	}

	.module-setting-strip__chip--custom {
		padding: 0 18rpx;
	}

	.module-setting-strip__chip-text {
		font-size: $font-size-caption;
		line-height: 1;
		color: $text-secondary;
	}

	.module-setting-strip__chip-text--selected {
		color: $accent-period;
		font-weight: $font-weight-title;
	}

	.module-setting-strip__chip-text--custom {
		color: $text-primary;
	}

	.module-setting-strip__picker-card {
		width: 188rpx;
		padding: 0;
		border-radius: 24rpx;
		background: transparent;
		box-sizing: border-box;
		align-self: center;
	}

	.module-setting-strip__wheel-shell {
		position: relative;
		width: 100%;
		height: 212rpx;
		border-radius: 24rpx;
		background: #f6f3ee;
		border: 2rpx solid $text-muted;
		box-sizing: border-box;
		overflow: hidden;
	}

	.module-setting-strip__wheel-shell::before,
	.module-setting-strip__wheel-shell::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 28rpx;
		z-index: 3;
		pointer-events: none;
	}

	.module-setting-strip__wheel-shell::before {
		top: 0;
		background: linear-gradient(180deg, rgba(246, 243, 238, 0.92) 0%, rgba(246, 243, 238, 0.18) 100%);
	}

	.module-setting-strip__wheel-shell::after {
		bottom: 0;
		background: linear-gradient(0deg, rgba(246, 243, 238, 0.92) 0%, rgba(246, 243, 238, 0.18) 100%);
	}

	.module-setting-strip__wheel-indicator {
		position: absolute;
		left: 12rpx;
		right: 12rpx;
		top: 50%;
		height: 52rpx;
		transform: translateY(-50%);
		border-radius: 26rpx;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 1rpx 0 rgba(230, 222, 213, 0.9) inset, 0 8rpx 18rpx rgba(47, 42, 38, 0.04);
		z-index: 1;
		pointer-events: none;
	}

	.module-setting-strip__wheel-track {
		width: 100%;
		height: 100%;
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0;
		box-sizing: border-box;
	}

	.module-setting-strip__picker-item {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 44rpx;
	}

	.module-setting-strip__picker-text {
		font-size: 28rpx;
		line-height: 1;
		color: #b7aca1;
		font-weight: 500;
		letter-spacing: 0.5rpx;
	}

	.module-setting-strip__picker-text--selected {
		color: #b7aca1;
		font-size: 28rpx;
		font-weight: 600;
	}
</style>
