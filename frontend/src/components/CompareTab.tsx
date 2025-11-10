import { useEffect, useState } from 'react';
import { getComparison } from '../adapters/infrastructure/routesService';

export default function CompareTab() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const c = await getComparison();
      setData(c);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading...</div>;
  if (!data?.baseline) return <div className="text-sm text-neutral-500">No baseline route set</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comparison</h3>
      <div className="text-sm">
        Baseline Route: <span className="font-medium">{data.baseline.route_id}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Route</th>
              <th className="text-left px-3 py-2 font-semibold">% Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {data.others.map((o: any, i: number) => (
              <tr key={i} className="hover:bg-neutral-50">
                <td className="px-3 py-2">{o.route.route_id}</td>
                <td className="px-3 py-2">{o.percentDiff.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


