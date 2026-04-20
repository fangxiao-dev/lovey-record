<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef MP-WEIXIN
			wx.cloud.init({
				env: 'prod-5gpr9j0q7ae42bfd',
				traceUser: true
			})
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	@use "@/styles/foundation/index.scss";
</style>
