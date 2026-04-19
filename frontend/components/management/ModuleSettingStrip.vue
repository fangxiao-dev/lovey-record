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
					<picker-view
						class="module-setting-strip__picker-view"
						:value="[resolvedPickerIndex]"
						indicator-style="height: 44rpx; border-radius: 22rpx; background: rgba(255, 255, 255, 0.96);"
						mask-style="background: linear-gradient(180deg, rgba(246, 243, 238, 0.92) 0%, rgba(246, 243, 238, 0.18) 100%); pointer-events: none;"
						@change="handlePickerChange"
					>
						<picker-view-column>
							<view
								v-for="option in customPickerOptions"
								:key="option.value"
								class="module-setting-strip__picker-item"
							>
								<text class="module-setting-strip__picker-text">{{ option.label }}</text>
							</view>
						</picker-view-column>
					</picker-view>
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
			}
		},
		methods: {
			handlePickerChange(e) {
				const index = e?.detail?.value?.[0];
				const option = this.customPickerOptions?.[index];
				if (!option) return;

				this.$emit('custom-change', {
					value: option.value,
					index
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
		height: 220rpx;
		border-radius: 24rpx;
		background: #f6f3ee;
		border: 2rpx solid $text-muted;
		box-sizing: border-box;
		overflow: hidden;
	}

	.module-setting-strip__picker-view {
		width: 100%;
		height: 100%;
		background: transparent;
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
</style>
