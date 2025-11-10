import { useEffect, useState } from 'react';
import { getRoutes, getComparison } from '../adapters/infrastructure/routesService';
import { gramsToTonnes } from '../shared/units';

export default function RoutesTab() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [comparison, setComparison] = useState<{ baseline: any | null; others: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [r, c] = await Promise.all([getRoutes(), getComparison()]);
      setRoutes(r);
      setComparison(c);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Routes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">ID</th>
              <th className="text-left px-3 py-2 font-semibold">Vessel</th>
              <th className="text-left px-3 py-2 font-semibold">Fuel</th>
              <th className="text-left px-3 py-2 font-semibold">Year</th>
              <th className="text-left px-3 py-2 font-semibold">GHGI (gCO₂e/MJ)</th>
              <th className="text-left px-3 py-2 font-semibold">Fuel (t)</th>
              <th className="text-left px-3 py-2 font-semibold">Distance (km)</th>
              <th className="text-left px-3 py-2 font-semibold">Baseline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2">{r.route_id}</td>
                <td className="px-3 py-2">{r.vessel_type}</td>
                <td className="px-3 py-2">{r.fuel_type}</td>
                <td className="px-3 py-2">{r.year}</td>
                <td className="px-3 py-2">{r.ghg_intensity}</td>
                <td className="px-3 py-2">{gramsToTonnes(Number(r.fuel_consumption_g || 0))}</td>
                <td className="px-3 py-2">{r.distance_km}</td>
                <td className="px-3 py-2">
                  {r.is_baseline ? <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs">Yes</span> : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-base font-medium mb-2">Baseline Comparison</h4>
        {!comparison?.baseline ? (
          <div className="text-sm text-neutral-500">No baseline set</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Route</th>
                  <th className="text-left px-3 py-2 font-semibold">% Diff vs Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {comparison.others.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">{o.route.route_id}</td>
                    <td className="px-3 py-2">{o.percentDiff.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


