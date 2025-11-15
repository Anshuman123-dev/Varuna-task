import { bankingRepository } from '../../adapters/outbound/postgres/bankingRepository.js';
import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';

export async function computeAdjustedCB(shipId: string, year: number) {
	const base = await complianceRepository.getBase(shipId, year);
	const baseCB = Number(base?.compliance_balance_gco2eq ?? 0);
	const banked = await bankingRepository.totalAvailable(shipId);
	const adjusted = baseCB + banked;
	await complianceRepository.setAdjusted(shipId, year, adjusted);
	return { baseCB, bankedSurplus: banked, adjustedCB: adjusted };
}



