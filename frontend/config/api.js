// API base URL routing - used by uni.request fallback in development
// Protocol-relative URL (//) automatically uses HTTPS in production, HTTP in dev
const PROD_API_BASE_URL = '//prod-5gpr9j0q7ae42bfd/api'; // WeChat Cloud Run environment ID: prod-5gpr9j0q7ae42bfd
const DEV_API_BASE_URL = 'http://localhost:3000/api'; // Local backend development server

export const API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? PROD_API_BASE_URL
		: DEV_API_BASE_URL;

/**
 * Cloud Run configuration for wx.cloud.callContainer
 * Used by cloud-request.js to route requests securely through WeChat's native gateway
 * This prevents public network exposure and guarantees OpenID authenticity.
 */
export const CLOUD_CONFIG = {
	envId: 'prod-5gpr9j0q7ae42bfd',        // Cloud Run environment ID
	serviceName: 'express-ovjd'            // Backend service name in this environment
};
