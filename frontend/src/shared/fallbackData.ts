// Random data generators for fallback when backend is unavailable

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomShipId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `SHIP-${letters[randomInt(0, 25)]}`;
}

// Compliance Tab Fallback Data
export function generateRandomComplianceResult() {
  const baseCB = randomInt(-50000000, 100000000);
  const penalty = baseCB < 0 ? randomInt(100000, 5000000) : 0;
  
  return {
    shipId: randomShipId(),
    year: randomInt(2025, 2030),
    ghgiActual: randomFloat(70, 95, 5),
    ghgiTarget: randomFloat(85, 92, 5),
    totalEnergyMJ: randomInt(50000000, 200000000),
    complianceBalance_gCO2eq: baseCB,
    penalty_eur: penalty
  };
}

export function generateRandomShips(): string[] {
  return ['SHIP-A', 'SHIP-B', 'SHIP-C', 'SHIP-D', 'SHIP-E', 'SHIP-F'];
}

export function generateRandomYears(): number[] {
  return [2025, 2026, 2027, 2028, 2029, 2030];
}

// Banking Tab Fallback Data
export function generateRandomAdjustedCB() {
  const baseCB = randomInt(-30000000, 80000000);
  const bankedSurplus = randomInt(0, 50000000);
  
  return {
    baseCB,
    bankedSurplus,
    adjustedCB: baseCB + bankedSurplus
  };
}

export function generateRandomVerifiedCB() {
  return {
    verifiedCB: randomInt(-20000000, 100000000)
  };
}

export function generateRandomAvailable() {
  return {
    total_gco2eq: randomInt(0, 80000000)
  };
}

export function generateRandomBankRecords(shipId: string) {
  const count = randomInt(2, 5);
  const records = [];
  
  for (let i = 0; i < count; i++) {
    const amount = randomInt(10000000, 50000000);
    const remaining = randomInt(0, amount);
    records.push({
      id: i + 1,
      ship_id: shipId,
      year_banked: 2025 + i,
      amount_gco2eq: amount.toString(),
      remaining_gco2eq: remaining.toString(),
      created_at: new Date().toISOString()
    });
  }
  
  return records;
}

export function generateRandomPenalty() {
  const verifiedCB = randomInt(-50000000, 20000000);
  const consecutiveYears = verifiedCB < 0 ? randomInt(1, 3) : 1;
  const penalty = verifiedCB < 0 ? Math.abs(verifiedCB) * 0.05 * consecutiveYears : 0;
  
  return {
    penalty: Math.round(penalty),
    consecutiveYears,
    verifiedCB
  };
}

export function generateRandomApplyResult() {
  const cb_before = randomInt(-50000000, -10000000);
  const applied = randomInt(5000000, 30000000);
  
  return {
    cb_before,
    applied,
    cb_after: cb_before + applied
  };
}

export function generateRandomBankResult() {
  return {
    banked: randomInt(10000000, 50000000)
  };
}

// Pooling Tab Fallback Data
export function generateRandomPoolResult(members: { shipId: string; year: number }[]) {
  return {
    poolId: randomInt(1, 100),
    members: members.map(m => ({
      shipId: m.shipId,
      adjusted: randomInt(-30000000, 80000000),
      verified: randomInt(-10000000, 90000000)
    }))
  };
}

export function generateRandomPools(year: number) {
  const count = randomInt(2, 5);
  const pools = [];
  
  for (let i = 0; i < count; i++) {
    pools.push({
      id: i + 1,
      year,
      total_adjusted_cb_gco2eq: randomInt(-50000000, 100000000).toString(),
      total_verified_cb_gco2eq: randomInt(-20000000, 120000000).toString(),
      status: 'active',
      created_at: new Date().toISOString()
    });
  }
  
  return pools;
}

// Routes Tab Fallback Data
export function generateRandomRoutes() {
  const count = randomInt(5, 10);
  const routes = [];
  const vesselTypes = ['Container', 'Tanker', 'Bulk Carrier', 'RoRo'];
  const fuelTypes = ['HFO', 'MDO', 'LNG', 'Methanol'];
  
  for (let i = 0; i < count; i++) {
    routes.push({
      id: i + 1,
      route_id: `ROUTE-${String(i + 1).padStart(3, '0')}`,
      vessel_type: vesselTypes[randomInt(0, vesselTypes.length - 1)],
      fuel_type: fuelTypes[randomInt(0, fuelTypes.length - 1)],
      year: randomInt(2025, 2030),
      ghg_intensity: randomFloat(70, 95, 5).toString(),
      fuel_consumption_g: randomInt(50000000, 200000000).toString(),
      lcv_mj_per_g: randomFloat(40, 45, 8).toString(),
      distance_km: randomFloat(1000, 15000, 2).toString(),
      ops_energy_mj: randomFloat(1000000, 5000000, 2).toString(),
      is_baseline: i === 0,
      created_at: new Date().toISOString()
    });
  }
  
  return routes;
}

export function generateRandomRouteDetails(routeId: string) {
  const vesselTypes = ['Container', 'Tanker', 'Bulk Carrier', 'RoRo'];
  const fuelTypes = ['HFO', 'MDO', 'LNG', 'Methanol'];
  
  return {
    id: randomInt(1, 100),
    route_id: routeId,
    vessel_type: vesselTypes[randomInt(0, vesselTypes.length - 1)],
    fuel_type: fuelTypes[randomInt(0, fuelTypes.length - 1)],
    year: randomInt(2025, 2030),
    ghg_intensity: randomFloat(70, 95, 5).toString(),
    fuel_consumption_g: randomInt(50000000, 200000000).toString(),
    lcv_mj_per_g: randomFloat(40, 45, 8).toString(),
    distance_km: randomFloat(1000, 15000, 2).toString(),
    ops_energy_mj: randomFloat(1000000, 5000000, 2).toString(),
    is_baseline: false,
    created_at: new Date().toISOString()
  };
}

export function generateRandomCompareResult() {
  return {
    baseline: {
      ghgi: randomFloat(85, 92, 5),
      totalEnergy: randomInt(80000000, 150000000),
      cb: randomInt(-20000000, 10000000)
    },
    alternative: {
      ghgi: randomFloat(70, 85, 5),
      totalEnergy: randomInt(70000000, 140000000),
      cb: randomInt(5000000, 40000000)
    },
    improvement: {
      ghgiReduction: randomFloat(5, 15, 2),
      cbImprovement: randomInt(10000000, 50000000),
      percentImprovement: randomFloat(20, 60, 2)
    }
  };
}
