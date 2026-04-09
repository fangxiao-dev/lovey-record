<template>
	<view class="join-page u-page-shell">
		<view v-if="state === 'loading'" class="join-page__loading">
			<text class="join-page__loading-text">验证中…</text>
		</view>

		<view v-else-if="state === 'valid'" class="join-page__confirm">
			<text class="join-page__module-name">月经记录</text>
			<text class="join-page__permission-label">你将以只读方式加入</text>
			<text class="join-page__permission-hint">加入后可以查看所有数据，但无法编辑。</text>
			<button class="join-page__join-btn" :disabled="joining" @tap="handleJoin">
				{{ joining ? '加入中…' : '加入' }}
			</button>
		</view>

		<view v-else class="join-page__error">
			<text class="join-page__error-message">{{ errorMessage }}</text>
			<button class="join-page__home-btn" @tap="handleGoHome">回到首页</button>
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
	TOKEN_EXPIRED: '邀请链接已过期（有效期24小时），请联系对方重新发送。',
	ALREADY_MEMBER: '你已经是这个模块的成员了。',
	IS_OWNER: '这是你自己的模块。',
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
	methods: {
		async validate() {
			try {
				const data = await validateInviteToken({
					apiBaseUrl: this.apiBaseUrl,
					openid: this.openid,
					token: this.token
				});
				this.moduleInstanceId = data.moduleInstanceId;
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
					token: this.token
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
			uni.switchTab({ url: '/pages/index/index' });
		},
	},
};
</script>

<style lang="scss">
.join-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px 32px;
	min-height: 60vh;

	&__loading-text {
		font-size: 16px;
		color: #6b7280;
	}

	&__module-name {
		font-size: 22px;
		font-weight: 600;
		margin-bottom: 12px;
	}

	&__permission-label {
		font-size: 16px;
		color: #374151;
		margin-bottom: 8px;
	}

	&__permission-hint {
		font-size: 13px;
		color: #6b7280;
		margin-bottom: 32px;
		text-align: center;
	}

	&__join-btn {
		background: #b45309;
		color: #fff;
		border-radius: 10px;
		padding: 12px 40px;
		font-size: 16px;
	}

	&__error-message {
		font-size: 15px;
		color: #6b7280;
		text-align: center;
		margin-bottom: 24px;
	}

	&__home-btn {
		background: #f3f4f6;
		color: #374151;
		border-radius: 10px;
		padding: 10px 32px;
		font-size: 15px;
	}
}
</style>
