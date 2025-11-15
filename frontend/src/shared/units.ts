export function gCO2eqToTonnes(gco2eq: number): string {
  return (gco2eq / 1_000_000).toFixed(2) + ' t';
}

export function gramsToTonnes(grams: number): string {
  return (grams / 1_000_000).toFixed(2) + ' t';
}

export function formatPenalty(eur: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eur);
}

// Note: Always send grams/gCO2eq to API, only convert for display



