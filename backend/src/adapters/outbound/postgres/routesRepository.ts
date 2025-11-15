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

export type RouteRecordWithEmissions = RouteRecord & {
  total_emissions_t: number | null;
};

export const routesRepository = {
  async list(): Promise<RouteRecordWithEmissions[]> {
    const db = getDb();
    const { rows } = await db.query<RouteRecord>('SELECT * FROM routes ORDER BY id ASC');
    // compute total emissions in tonnes when possible
    const enhanced = rows.map((r): RouteRecordWithEmissions => {
      const gi = Number(r.ghg_intensity ?? 0); // gCO2e/MJ
      const ops = Number(r.ops_energy_mj ?? 0); // MJ
      const hasEnergy = !Number.isNaN(gi) && !Number.isNaN(ops) && ops > 0 && gi > 0;
      const total_emissions_t = hasEnergy ? (gi * ops) / 1_000_000 : null; // convert g -> tonnes
      return { ...r, total_emissions_t };
    });
    return enhanced;
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
  },
  async create(input: Partial<RouteRecord>) {
    const db = getDb();
    const {
      route_id,
      vessel_type = null,
      fuel_type = null,
      year = null,
      ghg_intensity = null,
      fuel_consumption_g = null,
      lcv_mj_per_g = null,
      distance_km = null,
      ops_energy_mj = null,
      is_baseline = false
    } = input;

    const { rows } = await db.query<RouteRecord>(
      `INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption_g, lcv_mj_per_g, distance_km, ops_energy_mj, is_baseline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *;`,
      [
        route_id,
        vessel_type,
        fuel_type,
        year,
        ghg_intensity,
        fuel_consumption_g,
        lcv_mj_per_g,
        distance_km,
        ops_energy_mj,
        is_baseline
      ]
    );
    return rows[0];
  }
};

