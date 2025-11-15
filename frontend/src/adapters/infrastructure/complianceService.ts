import { apiGetWithFallback, apiPostWithFallback, apiGet } from './apiClientWithFallback';
import {
  generateRandomComplianceResult,
  generateRandomShips,
  generateRandomYears,
  generateRandomAdjustedCB,
  generateRandomVerifiedCB,
  generateRandomPenalty
} from '../../shared/fallbackData';

export async function calculateCompliance(body: {
  shipId: string;
  year: number;
  fuels: { mass_g: number; lcv_mj_per_g: number; ghg_intensity: number }[];
  opsEnergyMJ?: number;
}) {
  const fallbackData = generateRandomComplianceResult();
  const fallback = {
    ghgiActual: fallbackData.ghgiActual,
    totalEnergyMJ: fallbackData.totalEnergyMJ,
    complianceBalanceGCO2eq: fallbackData.complianceBalance_gCO2eq,
    penalty_eur: fallbackData.penalty_eur
  };
  const result = await apiPostWithFallback<{ ghgiActual: number; totalEnergyMJ: number; complianceBalanceGCO2eq: number; penalty_eur: number }>(
    '/compliance/calculate',
    body,
    fallback
  );
  return result.data;
}

export function getBaseCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  return apiGet<any>(`/compliance/base-cb?${params.toString()}`);
}

export async function getAdjustedCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  const fallback = generateRandomAdjustedCB();
  const result = await apiGetWithFallback<{ baseCB: number; bankedSurplus: number; adjustedCB: number }>(
    `/compliance/adjusted-cb?${params.toString()}`,
    fallback
  );
  return result.data;
}

export async function getVerifiedCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: String(year) });
  const fallback = generateRandomVerifiedCB();
  const result = await apiGetWithFallback<{ verifiedCB: number | null }>(
    `/compliance/verified-cb?${params.toString()}`,
    fallback
  );
  return result.data;
}

export async function getPenalty(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: year.toString() });
  const fallback = generateRandomPenalty();
  const result = await apiGetWithFallback<{ penalty: number; consecutiveYears: number; verifiedCB: number }>(
    `/compliance/penalty?${params.toString()}`,
    fallback
  );
  return result.data;
}

export function getCB(shipId: string, year: number) {
  const params = new URLSearchParams({ shipId, year: year.toString() });
  return apiGet<{ baseCB: number; bankedSurplus: number; adjustedCB: number; verifiedCB: number }>(`/compliance/cb?${params.toString()}`);
}

export async function getShips() {
  const fallback = generateRandomShips();
  const result = await apiGetWithFallback<string[]>('/compliance/ships', fallback);
  return result.data;
}

export async function getYears() {
  const fallback = generateRandomYears();
  const result = await apiGetWithFallback<number[]>('/compliance/years', fallback);
  return result.data;
}

