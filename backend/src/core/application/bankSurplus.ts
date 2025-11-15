import { bankingRepository } from '../../adapters/outbound/postgres/bankingRepository.js';
import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';

export async function bankSurplus({
	shipId,
	year,
	amount_gco2eq
}: {
	shipId: string;
	year: number;
	amount_gco2eq: number;
}) {
	if (amount_gco2eq <= 0) {
		throw new Error('Amount must be positive gCO2eq');
	}
	const base = await complianceRepository.getBase(shipId, year);
	if (!base || base.verified_cb_gco2eq == null) {
		throw new Error('Verified CB not available for banking');
	}
	const verified = Number(base.verified_cb_gco2eq);
	if (verified <= 0) {
		throw new Error('Only positive Verified CB can be banked');
	}
	if (amount_gco2eq > verified) {
		throw new Error('Cannot bank more than verified CB');
	}
	// Check if already banked for this year
	const alreadyBanked = await bankingRepository.hasAlreadyBanked(shipId, year);
	if (alreadyBanked) {
		throw new Error('Surplus already banked for this year');
	}
	await bankingRepository.bank(shipId, year, amount_gco2eq);
	return { banked: amount_gco2eq };
}



