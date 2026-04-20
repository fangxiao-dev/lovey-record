<template>
	<view class="management-card__actions">
		<view class="management-card__actions-main">
			<navigator class="management-action management-action--main ui-button ui-button--primary" :url="primaryUrl">
				<text class="ui-button__text management-action__text management-action__text--primary">{{ primaryLabel }}</text>
			</navigator>
			<view
				class="management-action management-action--main management-action--share ui-button ui-button--secondary"
				:class="{ 'management-action--busy': isMutating }"
				hover-class="ui-pressable-hover"
				:hover-stay-time="70"
				@tap="handleShareTap"
			>
				<text class="ui-button__text management-action__text management-action__text--share">
					{{ secondaryLabel }}
				</text>
			</view>
		</view>
		<view class="management-card__actions-destructive">
			<view class="management-action management-action--danger management-action--disabled">
				<text class="management-action__text management-action__text--danger">{{ destructiveLabel }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ModuleActionRow',
		emits: ['share'],
		props: {
			primaryLabel: {
				type: String,
				required: true
			},
			primaryUrl: {
				type: String,
				required: true
			},
			secondaryLabel: {
				type: String,
				required: true
			},
			destructiveLabel: {
				type: String,
				required: true
			},
			isMutating: {
				type: Boolean,
				default: false
			}
		},
		methods: {
			handleShareTap() {
				if (this.isMutating) return;
				this.$emit('share');
			}
		}
	};
</script>

<style lang="scss">
	$management-shared-green: #6bb98e;
	$management-shared-soft: #eaf7f0;

	.management-card__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		margin-top: 14rpx;
	}

	.management-card__actions-main {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10rpx;
		flex: 1;
		max-width: 296rpx;
	}

	.management-card__actions-destructive {
		display: flex;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	.management-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 64rpx;
		border-radius: 24rpx;
		padding: 0 24rpx;
		box-sizing: border-box;
		transition: opacity 120ms ease, transform 120ms ease, filter 120ms ease;
	}

	.management-action--main {
		width: 100%;
	}

	.management-action__text {
		color: $text-secondary;
	}

	.management-action__text--primary {
		color: $text-inverse;
	}

	.management-action--share {
		background: $management-shared-soft;
	}

	.management-action--busy {
		opacity: 0.68;
		pointer-events: none;
		filter: saturate(0.92);
	}

	.management-action__text--share {
		color: $management-shared-green;
		font-weight: $font-weight-title;
	}

	.management-action--danger {
		background: rgba(216, 154, 141, 0.08);
		min-width: 112rpx;
	}

	.management-action__text--danger {
		color: #b86052;
	}

	.management-action--disabled {
		opacity: 0.45;
	}
</style>
