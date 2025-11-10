import { apiGet } from './apiClient';

export function getRoutes() {
  return apiGet<any[]>('/routes');
}

export function setBaseline(id: number) {
  return apiGet<{ ok: boolean }>(`/routes/${id}/baseline`);
}

export function getComparison() {
  return apiGet<{ baseline: any | null; others: { route: any; percentDiff: number }[] }>('/routes/comparison');
}


