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
	async list(shipId: string, year?: number) {
		const db = getDb();
		if (year) {
			const { rows } = await db.query<BankRow>(
				`SELECT * FROM bank_entries WHERE ship_id=$1 AND year_banked=$2 ORDER BY year_banked DESC`,
				[shipId, year]
			);
			return rows;
		}
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
	},
	async hasAlreadyBanked(shipId: string, year: number): Promise<boolean> {
		const db = getDb();
		const { rows } = await db.query<{ count: string }>(
			`SELECT COUNT(*) as count FROM bank_entries WHERE ship_id=$1 AND year_banked=$2`,
			[shipId, year]
		);
		return Number(rows[0]?.count ?? 0) > 0;
	},
	async consumeBanked(shipId: string, amount: number) {
		const db = getDb();
		// Get entries FIFO (oldest first)
		const { rows } = await db.query<BankRow>(
			`SELECT * FROM bank_entries WHERE ship_id=$1 AND remaining_gco2eq > 0 ORDER BY year_banked ASC`,
			[shipId]
		);
		let remaining = amount;
		for (const row of rows) {
			if (remaining <= 0) break;
			const available = Number(row.remaining_gco2eq);
			const toConsume = Math.min(remaining, available);
			const newRemaining = available - toConsume;
			await db.query(
				`UPDATE bank_entries SET remaining_gco2eq=$1 WHERE id=$2`,
				[newRemaining, row.id]
			);
			remaining -= toConsume;
		}
	}
};


