import { getDb } from './client.js';

async function alterPenaltyColumn() {
	const db = getDb();
	try {
		await db.query(`
			ALTER TABLE ship_compliance 
			ALTER COLUMN penalty_eur TYPE DECIMAL(20,2);
		`);
		console.log('Successfully altered penalty_eur column to DECIMAL(20,2)');
	} catch (error) {
		console.error('Error altering penalty_eur column:', error);
		throw error;
	}
}

alterPenaltyColumn()
	.then(() => {
		console.log('Column alteration completed');
		process.exit(0);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
