export function roundToMRV(value: number): number {
	return Math.round(value * 100000) / 100000;
}

export type FuelInput = {
	mass_g: number;
	lcv_mj_per_g: number;
	ghg_intensity?: number;
};

export function calculateTotalEnergyMJ(fuels: FuelInput[], opsEnergyMJ: number = 0): number {
	const fuelEnergy = fuels.reduce((sum, fuel) => {
		return sum + fuel.mass_g * fuel.lcv_mj_per_g;
	}, 0);
	return roundToMRV(fuelEnergy + opsEnergyMJ);
}

export function calculateGHGIEactual(
	fuels: Required<FuelInput>[],
	totalEnergyMJ: number
): number {
	const weightedSum = fuels.reduce((sum, fuel) => {
		const energy = fuel.mass_g * fuel.lcv_mj_per_g;
		return sum + energy * fuel.ghg_intensity;
	}, 0);
	return roundToMRV(weightedSum / totalEnergyMJ);
}

export function calculateComplianceBalance(
	ghgiTarget: number,
	ghgiActual: number,
	totalEnergyMJ: number
): number {
	const cb = (ghgiTarget - ghgiActual) * totalEnergyMJ;
	return Math.round(cb);
}

export function calculatePenalty(
	complianceBalanceGCO2eq: number,
	ghgiActual: number,
	consecutiveYears: number = 1
): number {
	if (complianceBalanceGCO2eq >= 0) return 0;
	const absCB = Math.abs(complianceBalanceGCO2eq);
	const basePenalty = (absCB / ghgiActual) * 41000 * 2400;
	const totalPenalty = basePenalty * (1 + (consecutiveYears - 1) * 0.1);
	return Math.round(totalPenalty);
}

export function getGHGITarget(year: number): number {
	const targets: Record<number, number> = {
		2025: 89.3368,
		2030: 85.6904,
		2035: 77.9418,
		2040: 62.9004,
		2045: 34.6408,
		2050: 18.232
	};
	const years = Object.keys(targets)
		.map(Number)
		.sort((a, b) => a - b);
	for (let i = years.length - 1; i >= 0; i--) {
		if (year >= years[i]) return targets[years[i]];
	}
	return 91.16;
}


