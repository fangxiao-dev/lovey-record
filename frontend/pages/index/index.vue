<template>
	<ModuleManagementPage ref="managementPage" />
</template>

<script>
	import ModuleManagementPage from '../../components/management/ModuleManagementPage.vue';

	export default {
		name: 'ModuleManagementHomePage',
		components: {
			ModuleManagementPage
		},
		onLoad(options) {
			this._skipNextShowRefresh = true;
			this.$nextTick(() => {
				this.$refs.managementPage?.initialize(options || {});
			});
		},
		onShow() {
			if (this._skipNextShowRefresh) {
				this._skipNextShowRefresh = false;
				return;
			}

			this.$refs.managementPage?.refreshOnShow?.();
		}
	};
</script>
