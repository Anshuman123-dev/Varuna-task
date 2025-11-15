import { calculatePenalty } from '../../shared/formulas.js';
import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';

export async function calculatePenaltyWithConsecutive(shipId: string, year: number) {
	const rec = await complianceRepository.getBase(shipId, year);
	if (!rec) throw new Error('No compliance record');
	const verified = rec.verified_cb_gco2eq != null ? Number(rec.verified_cb_gco2eq) : Number(rec.adjusted_cb_gco2eq ?? rec.compliance_balance_gco2eq ?? 0);
	const ghgiActual = Number(rec.ghgi_actual ?? 0) || 1; // prevent division by zero
	const consecutive = await complianceRepository.getConsecutiveDeficitYears(shipId, year);
	const penalty = calculatePenalty(verified, ghgiActual, consecutive);
	await complianceRepository.setPenalty(shipId, year, penalty);
	return { penalty, consecutiveYears: consecutive, verifiedCB: verified };
}



