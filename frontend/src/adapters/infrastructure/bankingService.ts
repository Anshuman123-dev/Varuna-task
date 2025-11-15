import { apiGetWithFallback, apiPostWithFallback } from './apiClientWithFallback';
import {
  generateRandomAvailable,
  generateRandomBankRecords,
  generateRandomBankResult,
  generateRandomApplyResult
} from '../../shared/fallbackData';

export async function getAvailable(shipId: string) {
  const params = new URLSearchParams({ shipId });
  const fallback = generateRandomAvailable();
  const result = await apiGetWithFallback<{ total_gco2eq: number }>(
    `/banking/available?${params.toString()}`,
    fallback
  );
  return result.data;
}

export async function getRecords(shipId: string, year?: number) {
  const params = new URLSearchParams({ shipId });
  if (year) params.append('year', year.toString());
  const fallback = generateRandomBankRecords(shipId);
  const result = await apiGetWithFallback<any[]>(
    `/banking/records?${params.toString()}`,
    fallback
  );
  return result.data;
}

export async function bank(body: { shipId: string; year: number; amount_gco2eq: number }) {
  const fallback = generateRandomBankResult();
  const result = await apiPostWithFallback<{ banked: number }>(
    `/banking/bank`,
    body,
    fallback
  );
  return result.data;
}

export async function apply(body: { shipId: string; year: number; amount_gco2eq: number }) {
  const fallback = generateRandomApplyResult();
  const result = await apiPostWithFallback<{ cb_before: number; applied: number; cb_after: number }>(
    `/banking/apply`,
    body,
    fallback
  );
  return result.data;
}



