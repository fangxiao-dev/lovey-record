// Replace [YOUR_SERVICE_NAME] with the service ID shown in WeChat Cloud Run console
// e.g. if your console shows "prod-xxx", use "//prod-xxx/api"
const PROD_API_BASE_URL = '//prod-5gpr9l0q7ae42bfd/api';
const DEV_API_BASE_URL = 'http://localhost:3000/api';

export const API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? PROD_API_BASE_URL
		: DEV_API_BASE_URL;
