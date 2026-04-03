export type AffectedScope = 'dayDetail' | 'calendar' | 'prediction' | 'moduleOverview';

export function scopeResponse<T>(data: T, affectedScopes: AffectedScope[]) {
  return {
    ok: true as const,
    data,
    affectedScopes,
    error: null,
  };
}
