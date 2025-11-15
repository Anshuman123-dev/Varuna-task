import { getDb } from '../../../infrastructure/db/client.js';

export type PoolRow = {
	id: number;
	year: number;
	total_adjusted_cb_gco2eq: string | null;
	total_verified_cb_gco2eq: string | null;
	status: string;
	created_at: string;
};

export type PoolMemberRow = {
	id: number;
	pool_id: number;
	ship_id: string;
	adjusted_cb_gco2eq: string;
	verified_cb_gco2eq: string;
	created_at: string;
};

export const poolsRepository = {
	async createPool(year: number, members: { shipId: string; adjusted: number; verified: number }[]) {
		const db = getDb();
		const totalAdjusted = members.reduce((s, m) => s + m.adjusted, 0);
		const totalVerified = members.reduce((s, m) => s + m.verified, 0);
		const { rows } = await db.query<{ id: number }>(
			`INSERT INTO pools (year, total_adjusted_cb_gco2eq, total_verified_cb_gco2eq)
       VALUES ($1,$2,$3) RETURNING id`,
			[year, totalAdjusted, totalVerified]
		);
		const poolId = rows[0].id;
		for (const m of members) {
			await db.query(
				`INSERT INTO pool_members (pool_id, ship_id, adjusted_cb_gco2eq, verified_cb_gco2eq)
         VALUES ($1,$2,$3,$4)`,
				[poolId, m.shipId, m.adjusted, m.verified]
			);
		}
		return poolId;
	},
	async list(year?: number) {
		const db = getDb();
		const { rows } = await db.query<PoolRow>(
			year ? 'SELECT * FROM pools WHERE year=$1 ORDER BY id DESC' : 'SELECT * FROM pools ORDER BY id DESC',
			year ? [year] : []
		);
		return rows;
	},
	async get(poolId: number) {
		const db = getDb();
		const pool = await db.query<PoolRow>('SELECT * FROM pools WHERE id=$1', [poolId]);
		const members = await db.query<PoolMemberRow>(
			'SELECT * FROM pool_members WHERE pool_id=$1 ORDER BY id ASC',
			[poolId]
		);
		return { pool: pool.rows[0] ?? null, members: members.rows };
	}
};



