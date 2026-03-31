// Development and fallback API base URL
const PROD_API_BASE_URL = '//prod-5gpr9l0q7ae42bfd/api';
const DEV_API_BASE_URL = 'http://localhost:3000/api';

export const API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? PROD_API_BASE_URL
		: DEV_API_BASE_URL;

// Cloud Run configuration for wx.cloud.callContainer
export const CLOUD_CONFIG = {
	envId: 'prod-5gpr9j0q7ae42bfd',
	serviceName: 'express-ovjd'
};
