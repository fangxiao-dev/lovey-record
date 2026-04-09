<template>
	<view class="join-page">

		<!-- Loading -->
		<view v-if="state === 'loading'" class="join-page__loading">
			<view class="join-page__spinner" />
			<text class="join-page__loading-text">正在验证邀请链接…</text>
		</view>

		<!-- Valid -->
		<view v-else-if="state === 'valid'" class="join-page__confirm">
			<view class="join-page__deco-ring">
				<image v-if="moduleIconSrc" class="join-page__deco-icon" :src="moduleIconSrc" mode="aspectFit" />
				<text v-else class="join-page__deco-icon join-page__deco-icon--emoji">🌸</text>
			</view>

			<view class="join-page__badge">
				<view class="join-page__badge-dot" />
				<text class="join-page__badge-text">只读权限</text>
			</view>

			<view class="join-page__card">
				<text class="join-page__card-label">邀请你加入</text>
				<text class="join-page__card-module">月经记录</text>

				<view class="join-page__divider" />

				<view class="join-page__perm-row">
					<view class="join-page__perm-icon join-page__perm-icon--ok">
						<text class="join-page__perm-icon-text">✓</text>
					</view>
					<text class="join-page__perm-text"><text class="join-page__perm-bold">可以查看</text>所有周期记录、日历和统计数据</text>
				</view>
				<view class="join-page__perm-row">
					<view class="join-page__perm-icon join-page__perm-icon--no">
						<text class="join-page__perm-icon-text">✕</text>
					</view>
					<text class="join-page__perm-text"><text class="join-page__perm-bold">无法编辑</text>任何数据，仅供阅读</text>
				</view>
			</view>

			<view class="join-page__actions">
				<button
					class="join-page__btn join-page__btn--primary"
					:disabled="joining"
					:class="{ 'join-page__btn--loading': joining }"
					@tap="handleJoin"
				>{{ joining ? '加入中…' : '加入' }}</button>
				<button class="join-page__btn join-page__btn--secondary" @tap="handleGoHome">暂不加入</button>
			</view>
		</view>

		<!-- Error -->
		<view v-else class="join-page__error">
			<view class="join-page__error-icon">
				<text class="join-page__error-icon-text">🔗</text>
			</view>
			<text class="join-page__error-title">链接已失效</text>
			<text class="join-page__error-desc">{{ errorMessage }}</text>
			<button class="join-page__btn join-page__btn--secondary join-page__btn--narrow" @tap="handleGoHome">回到首页</button>
		</view>

	</view>
</template>

<script>
import { validateInviteToken } from '../../services/sharing/sharing-query-service.js';
import { acceptInvite } from '../../services/sharing/sharing-command-service.js';
import { mergeH5RouteQuery } from '../../utils/h5-route-query.js';

const ERROR_MESSAGES = {
	INVALID_TOKEN: '邀请链接无效，请联系对方重新发送。',
	TOKEN_ALREADY_USED: '这个邀请链接已经被使用过了。',
	TOKEN_EXPIRED: '邀请链接已过期（有效期 24 小时），请联系对方重新发送。',
	ALREADY_MEMBER: '你已经是这个模块的成员了。',
	IS_OWNER: '这是你自己的模块。',
};

const MODULE_ICON_MAP = {
	menstrual: '/static/management/menstruation.svg',
};

export default {
	name: 'JoinPage',
	data() {
		return {
			state: 'loading',   // 'loading' | 'valid' | 'error'
			token: null,
			openid: null,
			apiBaseUrl: null,
			moduleInstanceId: null,
			moduleType: null,
			errorMessage: '',
			joining: false,
		};
	},
	onLoad(options) {
		const runtimeOptions = mergeH5RouteQuery(options || {});
		const d = v => v && v !== 'undefined' ? decodeURIComponent(v) : null;
		this.token = d(runtimeOptions.token);
		this.openid = d(runtimeOptions.openid);
		this.apiBaseUrl = d(runtimeOptions.apiBaseUrl);

		if (!this.token) {
			this.state = 'error';
			this.errorMessage = ERROR_MESSAGES.INVALID_TOKEN;
			return;
		}
		this.validate();
	},
	computed: {
		moduleIconSrc() {
			return (this.moduleType && MODULE_ICON_MAP[this.moduleType]) || null;
		},
	},
	methods: {
		async validate() {
			try {
				const data = await validateInviteToken({
					apiBaseUrl: this.apiBaseUrl,
					openid: this.openid,
					token: this.token,
				});
				this.moduleInstanceId = data.moduleInstanceId;
				this.moduleType = data.moduleType || null;
				this.state = 'valid';
			} catch (err) {
				this.state = 'error';
				this.errorMessage = ERROR_MESSAGES[err.code] || '出现了未知错误，请稍后重试。';
			}
		},
		async handleJoin() {
			this.joining = true;
			try {
				await acceptInvite({
					apiBaseUrl: this.apiBaseUrl,
					openid: this.openid,
					token: this.token,
				});
				uni.redirectTo({
					url: `/pages/menstrual/home?openid=${encodeURIComponent(this.openid)}&moduleInstanceId=${encodeURIComponent(this.moduleInstanceId)}&apiBaseUrl=${encodeURIComponent(this.apiBaseUrl)}`,
				});
			} catch (err) {
				this.state = 'error';
				this.errorMessage = ERROR_MESSAGES[err.code] || '加入失败，请稍后重试。';
			} finally {
				this.joining = false;
			}
		},
		handleGoHome() {
			uni.reLaunch({ url: '/pages/index/index' });
		},
	},
};
</script>

<style lang="scss">
// ── Token 对齐 app 设计系统 ──────────────────────────────────
$bg:          #faf7f2;
$surface:     #ffffff;
$warm-100:    #f3eee7;
$warm-200:    #e6ded5;
$rose:        #c9786a;
$rose-soft:   #f3d7d1;
$rose-muted:  #e8c4bc;
$brown-900:   #2f2a26;
$brown-700:   #72685f;
$brown-500:   #a29488;
$amber-bg:    #fdf3e9;
$amber-border:#e8c99a;
$amber-text:  #8a5e28;
$amber-dot:   #c6914b;
$ok-bg:       #ecf5e9;
$ok-text:     #5a8a4a;
$err-bg:      #faeae9;
$err-text:    #b96858;

.join-page {
	min-height: 100vh;
	background: $bg;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48rpx 32rpx 64rpx;

	// ── Loading ──────────────────────────────────────────────
	&__loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	&__spinner {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		border: 4rpx solid $warm-200;
		border-top-color: $rose;
		animation: jp-spin .8s linear infinite;
	}

	&__loading-text {
		font-size: 26rpx;
		color: $brown-500;
	}

	@keyframes jp-spin {
		to { transform: rotate(360deg); }
	}

	// ── Confirm (valid state) ────────────────────────────────
	&__confirm {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	// 装饰环
	&__deco-ring {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: $rose-soft;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 28rpx;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			inset: -10rpx;
			border-radius: 50%;
			border: 2rpx solid $rose-muted;
			opacity: .45;
		}
	}

	&__deco-icon {
		width: 64rpx;
		height: 64rpx;

		&--emoji {
			font-size: 48rpx;
			line-height: 1;
			width: auto;
			height: auto;
		}
	}

	// 只读徽章
	&__badge {
		display: flex;
		align-items: center;
		gap: 8rpx;
		background: $amber-bg;
		border: 1rpx solid $amber-border;
		border-radius: 999rpx;
		padding: 6rpx 20rpx;
		margin-bottom: 32rpx;
	}

	&__badge-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: $amber-dot;
	}

	&__badge-text {
		font-size: 22rpx;
		font-weight: 600;
		color: $amber-text;
		letter-spacing: .5px;
	}

	// 卡片
	&__card {
		width: 100%;
		background: $surface;
		border-radius: 24rpx;
		padding: 36rpx 32rpx 28rpx;
		box-shadow: 0 2rpx 16rpx rgba(47, 42, 38, .06);
	}

	&__card-label {
		display: block;
		font-size: 20rpx;
		font-weight: 600;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: $brown-500;
		margin-bottom: 12rpx;
	}

	&__card-module {
		display: block;
		font-size: 40rpx;
		font-weight: 600;
		color: $brown-900;
		line-height: 1.3;
		margin-bottom: 8rpx;
	}

	&__divider {
		height: 1rpx;
		background: $warm-200;
		margin: 24rpx 0;
	}

	// 权限行
	&__perm-row {
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		margin-bottom: 16rpx;

		&:last-child { margin-bottom: 0; }
	}

	&__perm-icon {
		width: 32rpx;
		height: 32rpx;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2rpx;

		&--ok { background: $ok-bg; }
		&--no { background: $err-bg; }
	}

	&__perm-icon-text {
		font-size: 18rpx;
		font-weight: 700;
		.join-page__perm-icon--ok & { color: $ok-text; }
		.join-page__perm-icon--no & { color: $err-text; }
	}

	&__perm-text {
		font-size: 26rpx;
		color: $brown-700;
		line-height: 1.6;
	}

	&__perm-bold {
		font-weight: 600;
		color: $brown-900;
	}

	// 按钮组
	&__actions {
		width: 100%;
		margin-top: 32rpx;
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	&__btn {
		width: 100%;
		border-radius: 999rpx;
		border: none;
		font-size: 28rpx;
		font-weight: 600;
		padding: 28rpx 0;
		line-height: 1;
		letter-spacing: .3px;

		&::after { border: none; }

		&--primary {
			background: $rose;
			color: #fff;

			&[disabled] { opacity: .6; }
		}

		&--secondary {
			background: $warm-100;
			color: $brown-700;
		}

		&--narrow {
			width: auto;
			padding: 24rpx 64rpx;
		}
	}

	// ── Error state ──────────────────────────────────────────
	&__error {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__error-icon {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: $err-bg;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 32rpx;
	}

	&__error-icon-text {
		font-size: 44rpx;
		line-height: 1;
	}

	&__error-title {
		font-size: 34rpx;
		font-weight: 600;
		color: $brown-900;
		margin-bottom: 12rpx;
	}

	&__error-desc {
		font-size: 26rpx;
		color: $brown-500;
		text-align: center;
		line-height: 1.7;
		padding: 0 8rpx;
		margin-bottom: 40rpx;
	}
}
</style>
