import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';
import { poolsRepository } from '../../adapters/outbound/postgres/poolsRepository.js';

export type PoolMemberInput = { shipId: string; year: number };

export async function allocatePool(year: number, members: PoolMemberInput[]) {
	// Fetch adjusted CB for each member
	const enriched = [];
	for (const m of members) {
		const rec = await complianceRepository.getBase(m.shipId, year);
		const adjusted = Number(rec?.adjusted_cb_gco2eq ?? rec?.compliance_balance_gco2eq ?? 0);
		enriched.push({ shipId: m.shipId, adjusted });
	}
	const sumAdjusted = enriched.reduce((s, m) => s + m.adjusted, 0);
	if (sumAdjusted < 0) {
		throw new Error('Pool sum must be >= 0 gCO2eq');
	}
	
	// Sort by adjusted CB descending (surplus first)
	enriched.sort((a, b) => b.adjusted - a.adjusted);
	
	// Greedy allocation: transfer surplus to deficits
	const outputs: { shipId: string; adjusted: number; verified: number }[] = [];
	
	// Initialize verified with adjusted
	for (const m of enriched) {
		outputs.push({ shipId: m.shipId, adjusted: m.adjusted, verified: m.adjusted });
	}
	
	// Get surplus and deficit ships
	const surplusShips = outputs.filter((o) => o.adjusted > 0);
	const deficitShips = outputs.filter((o) => o.adjusted < 0);
	
	// Transfer surplus to deficits
	for (const deficit of deficitShips) {
		let needed = -deficit.adjusted; // Amount needed to reach zero
		
		for (const surplus of surplusShips) {
			if (needed <= 0) break;
			
			const available = surplus.verified; // Current available surplus
			if (available <= 0) continue;
			
			const transfer = Math.min(available, needed);
			
			// Update verified balances
			surplus.verified -= transfer;
			deficit.verified += transfer;
			needed -= transfer;
		}
	}
	
	// Validate pooling rules
	for (const o of outputs) {
		// Rule 1: Deficit ship cannot exit worse
		if (o.adjusted < 0 && o.verified < o.adjusted) {
			throw new Error(`Ship ${o.shipId} would exit with worse deficit (${o.verified} < ${o.adjusted})`);
		}
		// Rule 2: Surplus ship cannot exit negative
		if (o.adjusted >= 0 && o.verified < 0) {
			throw new Error(`Ship ${o.shipId} with surplus/zero cannot exit with deficit`);
		}
	}
	const poolId = await poolsRepository.createPool(
		year,
		outputs.map((o) => ({ shipId: o.shipId, adjusted: o.adjusted, verified: o.verified }))
	);
	// persist verified to compliance
	for (const o of outputs) {
		await complianceRepository.setVerified(o.shipId, year, o.verified);
	}
	return { poolId, members: outputs };
}



