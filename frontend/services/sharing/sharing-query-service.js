import { cloudRequest } from '../cloud-request.js';

async function queryEnvelope({ apiBaseUrl, openid, path, data }) {
	const cacheBustedPath = path + (path.includes('?') ? '&' : '?') + '_ts=' + Date.now();

	const response = await cloudRequest({
		path: cacheBustedPath,
		method: 'GET',
		data,
		headers: {
			'x-wx-openid': openid,
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || `Query failed: ${path}`);
	}

	return response.data.data;
}

export async function validateInviteToken({ apiBaseUrl, openid, token }) {
	return queryEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/queries/validateInviteToken',
		data: { token },
	});
}

export async function getModuleMembers({ apiBaseUrl, openid, moduleInstanceId }) {
	return queryEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/queries/getModuleMembers',
		data: { moduleInstanceId },
	});
}
