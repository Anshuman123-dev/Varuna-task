import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
	port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
	host: process.env.PGHOST,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	database: process.env.PGDATABASE
});

export function getDb() {
	return pool;
}

export async function withTx<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const res = await fn(client);
		await client.query('COMMIT');
		return res;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}



