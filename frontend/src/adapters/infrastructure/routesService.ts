import { apiGetWithFallback, apiPostWithFallback } from './apiClientWithFallback';
import { generateRandomRoutes, generateRandomRouteDetails } from '../../shared/fallbackData';

export async function getRoutes() {
  const fallback = generateRandomRoutes();
  const result = await apiGetWithFallback<any[]>('/routes', fallback);
  return result.data;
}

export async function setBaseline(id: number) {
  const fallback = { ok: true };
  const result = await apiPostWithFallback<{ ok: boolean }>(
    `/routes/${id}/baseline`,
    {},
    fallback
  );
  return result.data;
}

export async function getComparison() {
  const fallback = { baseline: null, others: [] };
  const result = await apiGetWithFallback<{ baseline: any | null; others: { route: any; percentDiff: number }[] }>(
    '/routes/comparison',
    fallback
  );
  return result.data;
}

export async function createRoute(payload: any) {
  const fallback = generateRandomRouteDetails(payload.route_id || 'NEW-ROUTE');
  const result = await apiPostWithFallback<any>('/routes', payload, fallback);
  return result.data;
}



