import { getDb } from './client.js';

async function seed() {
	const db = getDb();

	// Basic cleanup
	await db.query('DELETE FROM pool_members;');
	await db.query('DELETE FROM pools;');
	await db.query('DELETE FROM bank_entries;');
	await db.query('DELETE FROM ship_compliance;');
	await db.query('DELETE FROM routes;');

	// Insert 5 sample routes (fuel mass in GRAMS, ops_energy in MJ)
	const routes = [
		['R001', 'Container', 'HFO', 2024, 91.0, 5_000_000_000, 0.041, 12000.0, 2050000000, true],
		['R002', 'BulkCarrier', 'LNG', 2024, 88.0, 4_800_000_000, 0.055, 11500.0, 1968000000, false],
		['R003', 'Tanker', 'MGO', 2024, 93.5, 5_100_000_000, 0.043, 12500.0, 2091000000, false],
		['R004', 'RoRo', 'HFO', 2025, 89.2, 4_900_000_000, 0.041, 11800.0, 2009000000, false],
		['R005', 'Container', 'LNG', 2025, 90.5, 4_950_000_000, 0.055, 11900.0, 2722500000, false]
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


