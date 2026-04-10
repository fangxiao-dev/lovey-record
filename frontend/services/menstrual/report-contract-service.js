import { API_BASE_URL } from '../../config/api.js';
import { cloudRequest } from '../cloud-request.js';

export const DEFAULT_MENSTRUAL_REPORT_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module'
});

async function queryEnvelope({ openid, path, data }) {
	const cacheBustedPath = path + (path.includes('?') ? '&' : '?') + '_ts=' + Date.now();
	const response = await cloudRequest({
		path: cacheBustedPath,
		method: 'GET',
		data,
		headers: {
			'x-wx-openid': openid
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || `Query failed: ${path}`);
	}

	return response.data.data;
}

export async function loadMenstrualReportView(context = {}) {
	const resolved = { ...DEFAULT_MENSTRUAL_REPORT_CONTEXT, ...context };

	return queryEnvelope({
		openid: resolved.openid,
		path: '/api/queries/getModuleReportView',
		data: {
			moduleInstanceId: resolved.moduleInstanceId
		}
	});
}
