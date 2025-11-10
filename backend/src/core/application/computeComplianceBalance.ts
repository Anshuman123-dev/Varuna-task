import { calculateComplianceBalance, calculateGHGIEactual, calculateTotalEnergyMJ, getGHGITarget } from '../../shared/formulas.js';
import { complianceRepository } from '../../adapters/outbound/postgres/complianceRepository.js';

export async function computeComplianceBalance({
	shipId,
	year,
	fuels,
	opsEnergyMJ = 0
}: {
	shipId: string;
	year: number;
	fuels: { mass_g: number; lcv_mj_per_g: number; ghg_intensity: number }[];
	opsEnergyMJ?: number;
}) {
	const ghgiTarget = getGHGITarget(year);
	const totalEnergyMJ = calculateTotalEnergyMJ(fuels, opsEnergyMJ);
	const ghgiActual = calculateGHGIEactual(fuels, totalEnergyMJ);
	const complianceBalanceGCO2eq = calculateComplianceBalance(ghgiTarget, ghgiActual, totalEnergyMJ);
	await complianceRepository.upsertBase({
		shipId,
		year,
		ghgiActual,
		totalEnergyMJ,
		complianceBalance: complianceBalanceGCO2eq
	});
	return { ghgiActual, totalEnergyMJ, complianceBalanceGCO2eq };
}


