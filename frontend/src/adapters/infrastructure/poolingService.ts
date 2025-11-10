import { apiGet, apiPost } from './apiClient';

export function createPool(body: { year: number; members: { shipId: string; year: number }[] }) {
  return apiPost<{ poolId: number; members: { shipId: string; adjusted: number; verified: number }[] }>(`/pools`, body);
}

export function listPools(year?: number) {
  const qs = year ? `?year=${year}` : '';
  return apiGet<any[]>(`/pools${qs}`);
}

export function getPool(id: number) {
  return apiGet<{ pool: any | null; members: any[] }>(`/pools/${id}`);
}


