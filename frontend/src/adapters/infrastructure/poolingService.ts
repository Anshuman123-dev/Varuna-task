import { apiGetWithFallback, apiPostWithFallback } from './apiClientWithFallback';
import { generateRandomPoolResult, generateRandomPools } from '../../shared/fallbackData';

export async function createPool(body: { year: number; members: { shipId: string; year: number }[] }) {
  const fallback = generateRandomPoolResult(body.members);
  const result = await apiPostWithFallback<{ poolId: number; members: { shipId: string; adjusted: number; verified: number }[] }>(
    `/pools`,
    body,
    fallback
  );
  return result.data;
}

export async function listPools(year?: number) {
  const qs = year ? `?year=${year}` : '';
  const fallback = generateRandomPools(year || 2025);
  const result = await apiGetWithFallback<any[]>(`/pools${qs}`, fallback);
  return result.data;
}

export async function getPool(id: number) {
  const fallback = { pool: null, members: [] };
  const result = await apiGetWithFallback<{ pool: any | null; members: any[] }>(
    `/pools/${id}`,
    fallback
  );
  return result.data;
}


