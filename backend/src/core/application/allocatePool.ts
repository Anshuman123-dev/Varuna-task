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
	// Greedy: cover deficits from surpluses until exhausted
	const deficits = enriched.filter((m) => m.adjusted < 0).map((m) => ({ ...m, need: -m.adjusted }));
	let surpluses = enriched.filter((m) => m.adjusted > 0).map((m) => ({ ...m, avail: m.adjusted }));
	const outputs: { shipId: string; adjusted: number; verified: number }[] = [];
	// initialize verified with adjusted
	for (const m of enriched) outputs.push({ shipId: m.shipId, adjusted: m.adjusted, verified: m.adjusted });
	for (const d of deficits) {
		let remaining = d.need;
		for (const s of surpluses) {
			if (remaining <= 0) break;
			const take = Math.min(s.avail, remaining);
			s.avail -= take;
			remaining -= take;
			// update verified: deficit increases (towards zero), surplus decreases
			const di = outputs.findIndex((o) => o.shipId === d.shipId);
			const si = outputs.findIndex((o) => o.shipId === s.shipId);
			if (di >= 0) outputs[di].verified += take;
			if (si >= 0) outputs[si].verified -= take;
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


