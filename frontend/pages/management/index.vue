<template>
	<ModuleManagementPage ref="managementPage" />
</template>

<script>
	import ModuleManagementPage from '../../components/management/ModuleManagementPage.vue';

	export default {
		name: 'ModuleManagementAliasPage',
		components: {
			ModuleManagementPage
		},
		onLoad(options) {
			this.$nextTick(() => {
				this.$refs.managementPage?.initialize(options || {});
			});
		}
	};
</script>
