import { Router } from 'express';
import { routesRepository } from '../../outbound/postgres/routesRepository.js';

export const routesRouter = Router();

routesRouter.get('/', async (_req, res) => {
	const list = await routesRepository.list();
	res.json(list);
});

routesRouter.post('/', async (req, res, next) => {
  try {
    const created = await routesRepository.create(req.body ?? {});
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

routesRouter.post('/:id/baseline', async (req, res, next) => {
	try {
		await routesRepository.setBaseline(Number(req.params.id));
		res.json({ ok: true });
	} catch (e) {
		next(e);
	}
});

routesRouter.get('/comparison', async (_req, res) => {
	const data = await routesRepository.comparison();
	res.json(data);
});


