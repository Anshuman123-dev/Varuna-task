import { getDb } from '../../../infrastructure/db/client.js';

export type ComplianceRow = {
	id: number;
	ship_id: string;
	year: number;
	ghgi_actual: string | null;
	total_energy_mj: string | null;
	compliance_balance_gco2eq: string | null;
	adjusted_cb_gco2eq: string | null;
	verified_cb_gco2eq: string | null;
	penalty_eur: string | null;
	consecutive_deficit_years: number;
};

export const complianceRepository = {
	async upsertBase({
		shipId,
		year,
		ghgiActual,
		totalEnergyMJ,
		complianceBalance
	}: {
		shipId: string;
		year: number;
		ghgiActual: number;
		totalEnergyMJ: number;
		complianceBalance: number;
	}) {
		const db = getDb();
		await db.query(
			`INSERT INTO ship_compliance (ship_id, year, ghgi_actual, total_energy_mj, compliance_balance_gco2eq)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (ship_id, year)
       DO UPDATE SET ghgi_actual = EXCLUDED.ghgi_actual,
                     total_energy_mj = EXCLUDED.total_energy_mj,
                     compliance_balance_gco2eq = EXCLUDED.compliance_balance_gco2eq`,
			[shipId, year, ghgiActual, totalEnergyMJ, complianceBalance]
		);
	},
	async getBase(shipId: string, year: number) {
		const db = getDb();
		const { rows } = await db.query<ComplianceRow>(
			'SELECT * FROM ship_compliance WHERE ship_id=$1 AND year=$2',
			[shipId, year]
		);
		return rows[0] ?? null;
	},
	async setAdjusted(shipId: string, year: number, adjusted: number) {
		const db = getDb();
		await db.query(
			`UPDATE ship_compliance SET adjusted_cb_gco2eq=$3 WHERE ship_id=$1 AND year=$2`,
			[shipId, year, adjusted]
		);
	},
	async setVerified(shipId: string, year: number, verified: number) {
		const db = getDb();
		await db.query(
			`UPDATE ship_compliance SET verified_cb_gco2eq=$3 WHERE ship_id=$1 AND year=$2`,
			[shipId, year, verified]
		);
	},
	async setPenalty(shipId: string, year: number, penalty: number) {
		const db = getDb();
		await db.query(
			`UPDATE ship_compliance SET penalty_eur=$3 WHERE ship_id=$1 AND year=$2`,
			[shipId, year, penalty]
		);
	},
	async getConsecutiveDeficitYears(shipId: string, year: number): Promise<number> {
		const db = getDb();
		// Count consecutive years before or up to Y with negative verified_cb or compliance_balance if verified not available
		const { rows } = await db.query<ComplianceRow>(
			`SELECT year, COALESCE(verified_cb_gco2eq, adjusted_cb_gco2eq, compliance_balance_gco2eq) AS cb
       FROM ship_compliance WHERE ship_id=$1 AND year <= $2 ORDER BY year DESC`,
			[shipId, year]
		);
		let count = 0;
		for (const r of rows) {
			const cb = Number((r as any).cb ?? 0);
			if (cb < 0) count++;
			else break;
		}
		return count || 1;
	},
	async getDistinctShips(): Promise<string[]> {
		const db = getDb();
		const { rows } = await db.query<{ ship_id: string }>(
			'SELECT DISTINCT ship_id FROM ship_compliance ORDER BY ship_id'
		);
		return rows.map((r: { ship_id: string }) => r.ship_id);
	},
	async getDistinctYears(): Promise<number[]> {
		const db = getDb();
		const { rows } = await db.query<{ year: number }>(
			'SELECT DISTINCT year FROM ship_compliance ORDER BY year'
		);
		return rows.map((r: { year: number }) => r.year);
	}
};
