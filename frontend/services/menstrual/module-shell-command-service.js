function requestJson({ url, method, data, headers }) {
	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method,
			data,
			header: headers,
			success: (response) => resolve(response),
			fail: (error) => reject(error)
		});
	});
}

async function commandEnvelope({ apiBaseUrl, openid, path, data }) {
	const response = await requestJson({
		url: `${apiBaseUrl}${path}`,
		method: 'POST',
		data,
		headers: {
			'x-wx-openid': openid
		}
	});

	if (response.statusCode !== 200 || !response.data?.ok) {
		throw new Error(response.data?.error?.message || `Command failed: ${path}`);
	}

	return response.data.data;
}

export async function persistModuleSharingState({ context, action }) {
	const path = action === 'revoke'
		? '/commands/revokeModuleAccess'
		: '/commands/shareModuleInstance';

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
		path: '/commands/updateDefaultPeriodDuration',
		data: {
			moduleInstanceId: context.moduleInstanceId,
			defaultPeriodDurationDays
		}
	});
}
