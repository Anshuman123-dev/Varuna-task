import { Router } from 'express';
import { z } from 'zod';
import { allocatePool } from '../../../core/application/allocatePool.js';
import { poolsRepository } from '../../outbound/postgres/poolsRepository.js';

export const poolsRouter = Router();

const createBody = z.object({
	year: z.number().int(),
	members: z.array(z.object({ shipId: z.string(), year: z.number().int() })).min(1)
});

poolsRouter.post('/', async (req, res, next) => {
	try {
		const body = createBody.parse(req.body);
		const result = await allocatePool(body.year, body.members);
		res.json(result);
	} catch (e) {
		next(e);
	}
});

poolsRouter.get('/', async (req, res) => {
	const year = req.query.year ? Number(req.query.year) : undefined;
	const rows = await poolsRepository.list(year);
	res.json(rows);
});

poolsRouter.get('/:id', async (req, res) => {
	const id = Number(req.params.id);
	const data = await poolsRepository.get(id);
	res.json(data);
});



