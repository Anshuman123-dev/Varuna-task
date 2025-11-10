import { getDb } from '../../../infrastructure/db/client.js';

export type BankRow = {
	id: number;
	ship_id: string;
	year_banked: number;
	amount_gco2eq: string;
	remaining_gco2eq: string;
	created_at: string;
};

export const bankingRepository = {
	async totalAvailable(shipId: string): Promise<number> {
		const db = getDb();
		const { rows } = await db.query<{ sum: string }>(
			`SELECT COALESCE(SUM(remaining_gco2eq),0) as sum FROM bank_entries WHERE ship_id=$1`,
			[shipId]
		);
		return Number(rows[0]?.sum ?? 0);
	},
	async list(shipId: string) {
		const db = getDb();
		const { rows } = await db.query<BankRow>(
			`SELECT * FROM bank_entries WHERE ship_id=$1 ORDER BY year_banked DESC`,
			[shipId]
		);
		return rows;
	},
	async bank(shipId: string, year: number, amount: number) {
		const db = getDb();
		await db.query(
			`INSERT INTO bank_entries (ship_id, year_banked, amount_gco2eq, remaining_gco2eq)
       VALUES ($1,$2,$3,$3)`,
			[shipId, year, amount]
		);
	}
};


