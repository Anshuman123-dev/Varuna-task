import { getDb } from '../../../infrastructure/db/client.js';

export type RouteRecord = {
	id: number;
	route_id: string;
	vessel_type: string | null;
	fuel_type: string | null;
	year: number | null;
	ghg_intensity: string | null;
	fuel_consumption_g: string | null;
	lcv_mj_per_g: string | null;
	distance_km: string | null;
	ops_energy_mj: string | null;
	is_baseline: boolean;
	created_at: string;
};

export const routesRepository = {
	async list() {
		const db = getDb();
		const { rows } = await db.query<RouteRecord>('SELECT * FROM routes ORDER BY id ASC');
		return rows;
	},
	async setBaseline(id: number) {
		const db = getDb();
		await db.query('UPDATE routes SET is_baseline = false;');
		await db.query('UPDATE routes SET is_baseline = true WHERE id = $1;', [id]);
	},
	async comparison() {
		const db = getDb();
		const { rows } = await db.query<RouteRecord>('SELECT * FROM routes ORDER BY id ASC');
		const baseline = rows.find((r) => r.is_baseline);
		if (!baseline) return { baseline: null, others: [] as any[] };
		const baseIntensity = Number(baseline.ghg_intensity ?? 0);
		const others = rows
			.filter((r) => r.id !== baseline.id)
			.map((r) => {
				const gi = Number(r.ghg_intensity ?? 0);
				const diff = gi - baseIntensity;
				const percentDiff = baseIntensity === 0 ? 0 : (diff / baseIntensity) * 100;
				return { route: r, percentDiff };
			});
		return { baseline, others };
	}
};


