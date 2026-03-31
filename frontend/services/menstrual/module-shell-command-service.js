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
		throw new Error(response.data?.error?.message || `Command failed: ${path}`);
	}

	return response.data.data;
}

export async function persistModuleSharingState({ context, action }) {
	const path = action === 'revoke'
		? '/api/commands/revokeModuleAccess'
		: '/api/commands/shareModuleInstance';

	return commandEnvelope({
		apiBaseUrl: context.apiBaseUrl,
		openid: context.openid,
		path,
		data: {
			moduleInstanceId: context.moduleInstanceId,
			partnerUserId: context.partnerUserId
		}
	});
}

export async function persistModuleSettings({ context, defaultPeriodDurationDays }) {
	return commandEnvelope({
		apiBaseUrl: context.apiBaseUrl,
		openid: context.openid,
		path: '/api/commands/updateDefaultPeriodDuration',
		data: {
			moduleInstanceId: context.moduleInstanceId,
			defaultPeriodDurationDays
		}
	});
}
