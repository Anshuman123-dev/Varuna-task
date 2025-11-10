import { Router } from 'express';
import { z } from 'zod';
import { bankingRepository } from '../../outbound/postgres/bankingRepository.js';
import { bankSurplus } from '../../../core/application/bankSurplus.js';

export const bankingRouter = Router();

bankingRouter.get('/available', async (req, res) => {
	const shipId = String(req.query.shipId);
	const total = await bankingRepository.totalAvailable(shipId);
	res.json({ total_gco2eq: total });
});

bankingRouter.get('/records', async (req, res) => {
	const shipId = String(req.query.shipId);
	const rows = await bankingRepository.list(shipId);
	res.json(rows);
});

const bankBody = z.object({
	shipId: z.string(),
	year: z.number().int(),
	amount_gco2eq: z.number().positive()
});

bankingRouter.post('/bank', async (req, res, next) => {
	try {
		const body = bankBody.parse(req.body);
		const r = await bankSurplus(body);
		res.json(r);
	} catch (e) {
		next(e);
	}
});


