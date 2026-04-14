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
			const page = this.$refs.managementPage;
			const ctx = page && page.context;

			if (!ctx) {
				return { title: '月经记录' };
			}

			const accessRole = (page && page.selectedPermission) || 'VIEWER';
			const shareTitle = accessRole === 'PARTNER' ? '邀请你协作编辑月经记录' : '邀请你查看月经记录';

			return createInviteToken({
				apiBaseUrl: ctx.apiBaseUrl,
				openid: ctx.openid,
				moduleInstanceId: ctx.moduleInstanceId,
				accessRole,
			}).then((result) => {
				page && (page.showShareModal = false);
				const path = createJoinPageUrl({
					apiBaseUrl: ctx.apiBaseUrl,
					token: result?.data?.token,
				}).replace(/^\//, '');
				return { title: shareTitle, path };
			}).catch(() => {
				page && (page.showShareModal = false);
				return { title: '月经记录' };
			});
		},
	};
</script>
