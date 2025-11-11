import { Router } from 'express';
import { z } from 'zod';
import { computeComplianceBalance } from '../../../core/application/computeComplianceBalance.js';
import { complianceRepository } from '../../outbound/postgres/complianceRepository.js';
import { computeAdjustedCB } from '../../../core/application/computeAdjustedCB.js';
import { calculatePenaltyWithConsecutive } from '../../../core/application/calculatePenaltyWithConsecutive.js';

export const complianceRouter = Router();

const calcBody = z.object({
	shipId: z.string(),
	year: z.number().int(),
	fuels: z
		.array(
			z.object({
				mass_g: z.number().positive(),
				lcv_mj_per_g: z.number().positive(),
				ghg_intensity: z.number().positive()
			})
		)
		.min(1),
	opsEnergyMJ: z.number().min(0).optional()
});

complianceRouter.post('/calculate', async (req, res, next) => {
	try {
		const body = calcBody.parse(req.body);
		const result = await computeComplianceBalance(body);
		// compute immediate penalty for convenience
		const penalty = await calculatePenaltyWithConsecutive(body.shipId, body.year);
		res.json({ ...result, penalty_eur: penalty.penalty });
	} catch (e) {
		next(e);
	}
});

complianceRouter.get('/base-cb', async (req, res) => {
	const shipId = String(req.query.shipId);
	const year = Number(req.query.year);
	const base = await complianceRepository.getBase(shipId, year);
	res.json(base ?? {});
});

complianceRouter.get('/adjusted-cb', async (req, res) => {
	const shipId = String(req.query.shipId);
	const year = Number(req.query.year);
	const result = await computeAdjustedCB(shipId, year);
	res.json(result);
});

complianceRouter.get('/verified-cb', async (req, res) => {
	const shipId = String(req.query.shipId);
	const year = Number(req.query.year);
	const base = await complianceRepository.getBase(shipId, year);
	res.json({ verifiedCB: base?.verified_cb_gco2eq ?? null });
});

complianceRouter.get('/penalty', async (req, res, next) => {
	try {
		const shipId = String(req.query.shipId);
		const year = Number(req.query.year);
		const result = await calculatePenaltyWithConsecutive(shipId, year);
		res.json(result);
	} catch (e) {
		next(e);
	}
});

complianceRouter.get('/cb', async (req, res) => {
	const shipId = String(req.query.shipId);
	const year = Number(req.query.year);
	const base = await complianceRepository.getBase(shipId, year);
	if (!base) {
		res.json({ baseCB: null, bankedSurplus: null, adjustedCB: null, verifiedCB: null });
		return;
	}
	const result = await computeAdjustedCB(shipId, year);
	res.json({
		baseCB: Number(base.compliance_balance_gco2eq ?? 0),
		bankedSurplus: result.bankedSurplus,
		adjustedCB: result.adjustedCB,
		verifiedCB: Number(base.verified_cb_gco2eq ?? base.adjusted_cb_gco2eq ?? 0)
	});
});

complianceRouter.get('/ships', async (_req, res) => {
	const ships = await complianceRepository.getDistinctShips();
	res.json(ships);
});

complianceRouter.get('/years', async (_req, res) => {
	const years = await complianceRepository.getDistinctYears();
	res.json(years);
});
