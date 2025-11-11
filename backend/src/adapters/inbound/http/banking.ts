import { Router } from 'express';
import { z } from 'zod';
import { bankingRepository } from '../../outbound/postgres/bankingRepository.js';
import { bankSurplus } from '../../../core/application/bankSurplus.js';
import { applyBankedSurplus } from '../../../core/application/applyBankedSurplus.js';

export const bankingRouter = Router();

bankingRouter.get('/available', async (req, res) => {
	const shipId = String(req.query.shipId);
	const total = await bankingRepository.totalAvailable(shipId);
	res.json({ total_gco2eq: total });
});

bankingRouter.get('/records', async (req, res) => {
	const shipId = String(req.query.shipId);
	const year = req.query.year ? Number(req.query.year) : undefined;
	const rows = await bankingRepository.list(shipId, year);
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

const applyBody = z.object({
	shipId: z.string(),
	year: z.number().int(),
	amount_gco2eq: z.number().positive()
});

bankingRouter.post('/apply', async (req, res, next) => {
	try {
		const body = applyBody.parse(req.body);
		const r = await applyBankedSurplus(body);
		res.json(r);
	} catch (e) {
		next(e);
	}
});


