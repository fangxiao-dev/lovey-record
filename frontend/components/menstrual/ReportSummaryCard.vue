<template>
	<view class="report-summary-card ui-card">
		<text class="report-summary-card__title">摘要（实际均值）</text>
		<view
			v-for="row in rows"
			:key="row.key"
			class="report-summary-card__row"
		>
			<view class="report-summary-card__metric">
				<text class="report-summary-card__label">{{ row.label }}</text>
				<text class="report-summary-card__average">{{ row.averageText }}</text>
			</view>
			<text class="report-summary-card__fluctuation">{{ row.fluctuationText }}</text>
		</view>
		<view
			v-if="footer"
			class="report-summary-card__footer"
		>
			<view class="report-summary-card__footer-main">
				<text class="report-summary-card__footer-copy">
					<text
						v-for="(segment, index) in footerCopySegments"
						:key="`${segment.text}-${index}`"
						:class="[
							'report-summary-card__footer-copy-segment',
							segment.tone === 'primary'
								? 'report-summary-card__footer-copy-segment--primary'
								: 'report-summary-card__footer-copy-segment--muted'
						]"
					>
						{{ segment.text }}
					</text>
				</text>
				<view class="report-summary-card__footer-actions">
					<button
						class="report-summary-card__footer-trigger"
						hover-class="button-hover"
						:hover-stay-time="70"
						@tap="$emit('footer-tap', { footer, action: 'settings' })"
					>
						<template v-if="footer.portalMode === 'readonly-warning'">
							<text class="report-summary-card__footer-action">!</text>
						</template>
						<template v-else>
							<text class="report-summary-card__footer-action">手动调整</text>
							<image
								class="report-summary-card__footer-icon"
								src="/static/icons/wrench.png"
								mode="aspectFit"
							/>
						</template>
					</button>
					<button
						class="report-summary-card__footer-trigger"
						hover-class="button-hover"
						:hover-stay-time="70"
						@tap="$emit('footer-tap', { footer, action: 'align' })"
					>
						<text class="report-summary-card__footer-action">一键对齐</text>
						<image
							class="report-summary-card__footer-icon"
							src="/static/icons/refresh.png"
							mode="aspectFit"
						/>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'ReportSummaryCard',
		emits: ['footer-tap'],
		props: {
			rows: {
				type: Array,
				default: () => []
			},
			footer: {
				type: Object,
				default: null
			}
		},
		computed: {
			footerCopySegments() {
				const text = this.footer?.currentSettingsText || '';
				if (!text) return [];

				return text
					.split(/(\d+|-)/g)
					.filter((segment) => segment)
					.map((segment) => ({
						text: segment,
						tone: /^(\d+|-)$/.test(segment) ? 'primary' : 'muted'
					}));
			}
		}
	};
</script>

<style lang="scss">
	.report-summary-card {
		display: flex;
		flex-direction: column;
		padding: 24rpx;
	}

	.report-summary-card__title {
		display: block;
		text-align: center;
		font-size: 30rpx;
		line-height: 1.4;
		font-weight: $font-weight-medium;
		color: $text-primary;
		padding-bottom: 14rpx;
		border-bottom: 2rpx solid #f1e7dc;
		margin-bottom: 8rpx;
	}

	.report-summary-card__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16rpx;
		padding: 12rpx 0;
	}

	.report-summary-card__row + .report-summary-card__row {
		border-top: 2rpx solid #f1e7dc;
	}

	.report-summary-card__metric {
		display: inline-flex;
		align-items: baseline;
		gap: 10rpx;
		min-width: 0;
	}

	.report-summary-card__label,
	.report-summary-card__average,
	.report-summary-card__fluctuation {
		font-size: 26rpx;
		line-height: 1.4;
	}

	.report-summary-card__label {
		color: $text-secondary;
	}

	.report-summary-card__average {
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.report-summary-card__fluctuation {
		color: $text-muted;
		flex-shrink: 0;
	}

	.report-summary-card__footer {
		padding-top: 16rpx;
		margin-top: 6rpx;
		border-top: 2rpx solid #f1e7dc;
	}

	.report-summary-card__footer-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 18rpx;
	}

	.report-summary-card__footer-copy {
		font-size: 26rpx;
		line-height: 1.5;
	}

	.report-summary-card__footer-copy-segment--primary {
		color: $text-primary;
	}

	.report-summary-card__footer-copy-segment--muted {
		color: $text-muted;
	}

	.report-summary-card__footer-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16rpx;
	}

	.report-summary-card__footer-trigger {
		display: inline-flex;
		align-items: center;
		gap: 10rpx;
		min-height: 56rpx;
		padding: 0 18rpx;
		margin: 0;
		line-height: 1;
		border-radius: 999rpx;
		background: #f6efe7;
		border: 2rpx solid rgba(230, 222, 213, 0.9);

		&::after {
			border: none;
		}
	}

	.report-summary-card__footer-action {
		font-size: 24rpx;
		line-height: 1;
		font-weight: $font-weight-medium;
		color: $text-primary;
	}

	.report-summary-card__footer-icon {
		width: 26rpx;
		height: 26rpx;
		flex-shrink: 0;
	}
</style>
