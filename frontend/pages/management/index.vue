<template>
	<ModuleManagementPage ref="managementPage" />
</template>

<script>
	import ModuleManagementPage from '../../components/management/ModuleManagementPage.vue';
	import { createInviteToken } from '../../services/sharing/sharing-command-service.js';
	import { createJoinPageUrl } from '../../services/menstrual/module-shell-service.js';

	export default {
		name: 'ModuleManagementAliasPage',
		components: {
			ModuleManagementPage
		},
		onLoad(options) {
			// Store options for mounted(); in H5, $refs are not available at onLoad time
			// because child components have not mounted yet. mounted() guarantees refs exist.
			this._loadOptions = options || {};
		},
		mounted() {
			this.$refs.managementPage?.initialize(this._loadOptions || {});
		},
		onShareAppMessage() {
			const ctx = this.$refs.managementPage && this.$refs.managementPage.context;

			if (!ctx) {
				return { title: '月经记录' };
			}

			return createInviteToken({
				apiBaseUrl: ctx.apiBaseUrl,
				openid: ctx.openid,
				moduleInstanceId: ctx.moduleInstanceId,
			}).then((result) => {
				this.$refs.managementPage && (this.$refs.managementPage.showShareModal = false);
				const path = createJoinPageUrl({
					apiBaseUrl: ctx.apiBaseUrl,
					token: result?.data?.token,
				}).replace(/^\//, '');
				return { title: '邀请你查看月经记录', path };
			}).catch(() => {
				this.$refs.managementPage && (this.$refs.managementPage.showShareModal = false);
				return { title: '月经记录' };
			});
		},
	};
</script>
