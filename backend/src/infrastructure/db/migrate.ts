import { getDb } from './client.js';

async function migrate() {
	const db = getDb();
	// routes
	await db.query(`
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(50) UNIQUE NOT NULL,
  vessel_type VARCHAR(50),
  fuel_type VARCHAR(50),
  year INTEGER,
  ghg_intensity DECIMAL(10,5),
  fuel_consumption_g BIGINT,
  lcv_mj_per_g DECIMAL(10,8),
  distance_km DECIMAL(10,2),
  ops_energy_mj DECIMAL(15,2),
  is_baseline BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);`);

	// ship_compliance
	await db.query(`
CREATE TABLE IF NOT EXISTS ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50),
  year INTEGER,
  ghgi_actual DECIMAL(10,5),
  total_energy_mj DECIMAL(20,5),
  compliance_balance_gco2eq BIGINT,
  adjusted_cb_gco2eq BIGINT,
  verified_cb_gco2eq BIGINT,
  penalty_eur DECIMAL(20,2),
  consecutive_deficit_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ship_id, year)
);`);

	// bank_entries
	await db.query(`
CREATE TABLE IF NOT EXISTS bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50),
  year_banked INTEGER,
  amount_gco2eq BIGINT,
  remaining_gco2eq BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);`);

	// pools
	await db.query(`
CREATE TABLE IF NOT EXISTS pools (
  id SERIAL PRIMARY KEY,
  year INTEGER,
  total_adjusted_cb_gco2eq BIGINT,
  total_verified_cb_gco2eq BIGINT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);`);

	// pool_members
	await db.query(`
CREATE TABLE IF NOT EXISTS pool_members (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER REFERENCES pools(id),
  ship_id VARCHAR(50),
  adjusted_cb_gco2eq BIGINT,
  verified_cb_gco2eq BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);`);
}

migrate()
	.then(() => {
		console.log('Migration completed');
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});



