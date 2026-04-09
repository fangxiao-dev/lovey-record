import { cloudRequest } from '../cloud-request.js';

async function commandEnvelope({ apiBaseUrl, openid, path, data }) {
	const response = await cloudRequest({
		path,
		method: 'POST',
		data,
		headers: {
			'x-wx-openid': openid,
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		const apiError = response.data?.error;
		const e = new Error(apiError?.message || `Command failed: ${path}`);
		e.code = apiError?.code;
		throw e;
	}

	return {
		data: response.data.data,
		affectedScopes: response.data.affectedScopes ?? null
	};
}

export async function createInviteToken({ apiBaseUrl, openid, moduleInstanceId }) {
	return commandEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/commands/createInviteToken',
		data: { moduleInstanceId },
	});
}

export async function acceptInvite({ apiBaseUrl, openid, token }) {
	return commandEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/commands/acceptInvite',
		data: { token },
	});
}

export async function leaveModule({ apiBaseUrl, openid, moduleInstanceId }) {
	return commandEnvelope({
		apiBaseUrl,
		openid,
		path: '/api/commands/leaveModule',
		data: { moduleInstanceId },
	});
}
