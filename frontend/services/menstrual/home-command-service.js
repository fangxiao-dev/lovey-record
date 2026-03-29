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

function getSelectedLevel(row) {
	const selectedIndex = row.options.findIndex((option) => option.selected);
	return selectedIndex === -1 ? null : selectedIndex + 1;
}

export function extractSelectedDetailLevels(pageModel) {
	const rows = pageModel?.selectedDatePanel?.attributeRows || [];
	const byKey = new Map(rows.map((row) => [row.key, row]));

	return {
		flowLevel: byKey.has('flow') ? getSelectedLevel(byKey.get('flow')) : null,
		painLevel: byKey.has('pain') ? getSelectedLevel(byKey.get('pain')) : null,
		colorLevel: byKey.has('color') ? getSelectedLevel(byKey.get('color')) : null
	};
}

export async function persistSelectedDateDetails({ context, activeDate, pageModel }) {
	const levels = extractSelectedDetailLevels(pageModel);

	return commandEnvelope({
		apiBaseUrl: context.apiBaseUrl,
		openid: context.openid,
		path: '/commands/recordDayDetails',
		data: {
			moduleInstanceId: context.moduleInstanceId,
			date: activeDate,
			painLevel: levels.painLevel,
			flowLevel: levels.flowLevel,
			colorLevel: levels.colorLevel
		}
	});
}

export async function persistSelectedDatePeriodState({ context, activeDate, pageModel, isPeriodMarked }) {
	if (!isPeriodMarked) {
		return commandEnvelope({
			apiBaseUrl: context.apiBaseUrl,
			openid: context.openid,
			path: '/commands/clearPeriodDay',
			data: {
				moduleInstanceId: context.moduleInstanceId,
				date: activeDate
			}
		});
	}

	const levels = extractSelectedDetailLevels(pageModel);

	return commandEnvelope({
		apiBaseUrl: context.apiBaseUrl,
		openid: context.openid,
		path: '/commands/recordPeriodDay',
		data: {
			moduleInstanceId: context.moduleInstanceId,
			date: activeDate,
			painLevel: levels.painLevel ?? undefined,
			flowLevel: levels.flowLevel ?? undefined,
			colorLevel: levels.colorLevel ?? undefined
		}
	});
}
