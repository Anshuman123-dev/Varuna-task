import { apiGet, apiPost } from './apiClient';

export function calculateCompliance(body: {
  shipId: string;
  year: number;
  fuels: { mass_g: number; lcv_mj_per_g: number; ghg_intensity: number }[];
  opsEnergyMJ?: number;
}) {
  return apiPost<{ ghgiActual: number; totalEnergyMJ: number; complianceBalanceGCO2eq: number; penalty_eur: number }>(
    '/compliance/calculate',
    body
  );
}

export function getBaseCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  return apiGet<any>(`/compliance/base-cb?${params.toString()}`);
}

export function getAdjustedCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  return apiGet<{ baseCB: number; bankedSurplus: number; adjustedCB: number }>(`/compliance/adjusted-cb?${params.toString()}`);
}

export function getVerifiedCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  return apiGet<{ verifiedCB: number | null }>(`/compliance/verified-cb?${params.toString()}`);
}

export function getPenalty(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: year.toString() });
  return apiGet<{ penalty: number; consecutiveYears: number; verifiedCB: number }>(`/compliance/penalty?${params.toString()}`);
}

export function getCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: year.toString() });
  return apiGet<{ baseCB: number; bankedSurplus: number; adjustedCB: number; verifiedCB: number }>(`/compliance/cb?${params.toString()}`);
}
