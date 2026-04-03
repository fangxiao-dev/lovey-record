export function resolveRefreshTarget(scopes) {
	if (scopes == null) return 'fullSnapshot';
	if (!Array.isArray(scopes) || scopes.length === 0) return 'skip';
	if (scopes.includes('prediction') || scopes.includes('moduleOverview')) return 'fullSnapshot';
	if (scopes.includes('dayDetail')) return 'dayDetail';
	if (scopes.includes('calendar')) return 'calendar';
	return 'fullSnapshot';
}
