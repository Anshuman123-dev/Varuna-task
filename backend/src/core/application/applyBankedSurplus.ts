import { bankingRepository } from '../../adapters/outbound/postgres/bankingRepository.js';
import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';

export async function applyBankedSurplus({
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

	// Get current compliance balance
	const base = await complianceRepository.getBase(shipId, year);
	if (!base) {
		throw new Error('Compliance record not found for this year');
	}

	const adjustedCB = Number(base.adjusted_cb_gco2eq ?? base.compliance_balance_gco2eq ?? 0);
	
	// Can only apply to deficit
	if (adjustedCB >= 0) {
		throw new Error('Can only apply banked surplus to a deficit');
	}

	// Check available banked surplus
	const availableBanked = await bankingRepository.totalAvailable(shipId);
	if (amount_gco2eq > availableBanked) {
		throw new Error(`Insufficient banked surplus. Available: ${availableBanked} gCO2eq`);
	}

	// Consume banked entries FIFO
	await bankingRepository.consumeBanked(shipId, amount_gco2eq);

	// Calculate new adjusted CB
	const cb_before = adjustedCB;
	const applied = amount_gco2eq;
	const cb_after = adjustedCB + amount_gco2eq;

	// Update adjusted CB
	await complianceRepository.setAdjusted(shipId, year, cb_after);

	return {
		cb_before,
		applied,
		cb_after
	};
}
