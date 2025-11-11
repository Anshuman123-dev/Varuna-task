import { apiGet, apiPost } from './apiClient';

export function getAvailable(shipId: string) {
  const params = new URLSearchParams({ shipId });
  return apiGet<{ total_gco2eq: number }>(`/banking/available?${params.toString()}`);
}

export function getRecords(shipId: string, year?: number) {
  const params = new URLSearchParams({ shipId });
  if (year) params.append('year', year.toString());
  return apiGet<any[]>(`/banking/records?${params.toString()}`);
}

export function bank(body: { shipId: string; year: number; amount_gco2eq: number }) {
  return apiPost<{ banked: number }>(`/banking/bank`, body);
}

export function apply(body: { shipId: string; year: number; amount_gco2eq: number }) {
  return apiPost<{ cb_before: number; applied: number; cb_after: number }>(`/banking/apply`, body);
}


