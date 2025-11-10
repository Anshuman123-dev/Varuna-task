import { getDb } from './client.js';

async function seed() {
	const db = getDb();

	// Basic cleanup
	await db.query('DELETE FROM pool_members;');
	await db.query('DELETE FROM pools;');
	await db.query('DELETE FROM bank_entries;');
	await db.query('DELETE FROM ship_compliance;');
	await db.query('DELETE FROM routes;');

	// Insert 5 sample routes (fuel mass in GRAMS)
	const routes = [
		['R-001', 'container', 'VLSFO', 2025, 94.0, 50_000_000, 0.041, 1200.0, 0, true],
		['R-002', 'container', 'VLSFO', 2025, 88.5, 35_000_000, 0.041, 900.0, 0, false],
		['R-003', 'ro-ro', 'MGO', 2025, 92.0, 18_500_000, 0.043, 600.0, 0, false],
		['R-004', 'bulk', 'VLSFO', 2025, 90.1, 70_000_000, 0.041, 1800.0, 0, false],
		['R-005', 'tanker', 'LNG', 2025, 75.0, 22_000_000, 0.055, 1100.0, 0, false]
	] as const;

	for (const r of routes) {
		await db.query(
			`INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption_g, lcv_mj_per_g, distance_km, ops_energy_mj, is_baseline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			r as unknown as any[]
		);
	}

	// Example ship_compliance seed with both surplus and deficit
	await db.query(
		`INSERT INTO ship_compliance (ship_id, year, ghgi_actual, total_energy_mj, compliance_balance_gco2eq, adjusted_cb_gco2eq, verified_cb_gco2eq, penalty_eur, consecutive_deficit_years)
     VALUES 
     ('SHIP-A', 2025, 88.50000, 1500000.00000, 1000000, 1000000, 800000, 0, 0),
     ('SHIP-B', 2025, 94.00000, 2050000000.00000, -9559560000, -9559560000, -9559560000, 0, 1)`
	);

	console.log('Seed completed');
}

seed()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});


