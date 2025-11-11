import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getComparison, getRoutes, setBaseline } from '../adapters/infrastructure/routesService';

export default function CompareTab() {
  const [data, setData] = useState<any | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [c, r] = await Promise.all([getComparison(), getRoutes()]);
    setData(c);
    setRoutes(r);
    setLoading(false);
  };

  const handleBaselineChange = async (routeId: number) => {
    setChanging(true);
    try {
      await setBaseline(routeId);
      await loadData();
    } catch (error) {
      console.error('Failed to change baseline:', error);
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-neutral-500">Loading comparison data...</div>
      </div>
    );
  }

  if (!data?.baseline) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-neutral-500">No baseline route set</div>
      </div>
    );
  }

  const chartData = data.others.map((o: any) => ({
    name: o.route.route_id,
    value: o.percentDiff,
  }));

  const getBarColor = (value: number) => {
    if (value > 0) return '#ef4444'; // red for longer routes
    return '#22c55e'; // green for shorter routes
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h3 className="text-2xl font-semibold text-neutral-800">Route Comparison</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Comparing alternative routes against baseline
        </p>
      </div>

      {/* Baseline Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-neutral-700">Baseline Route:</span>
            <span className="text-sm font-semibold text-blue-700">{data.baseline.route_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-neutral-700">Change Baseline:</label>
            <select
              value={data.baseline.id}
              onChange={(e) => handleBaselineChange(Number(e.target.value))}
              disabled={changing}
              className="px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.route_id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Total Routes</div>
          <div className="mt-1 text-2xl font-bold text-neutral-800">{data.others.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Shorter Routes</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {data.others.filter((o: any) => o.percentDiff < 0).length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Longer Routes</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {data.others.filter((o: any) => o.percentDiff > 0).length}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-4">Percentage Difference from Baseline</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 12, fill: '#737373' }}
            />
            <YAxis 
              label={{ value: '% Difference', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#737373' } }}
              tick={{ fontSize: 12, fill: '#737373' }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <ReferenceLine y={0} stroke="#737373" strokeWidth={2} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-neutral-600">Shorter than baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-neutral-600">Longer than baseline</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-700">Detailed Comparison</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Route ID</th>
                <th className="text-left px-6 py-3 font-semibold">Difference</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {data.others.map((o: any, i: number) => (
                <tr key={i} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-neutral-800">{o.route.route_id}</td>
                  <td className="px-6 py-3">
                    <span className={`font-semibold ${o.percentDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {o.percentDiff > 0 ? '+' : ''}{o.percentDiff.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      o.percentDiff < 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {o.percentDiff < 0 ? 'Shorter' : 'Longer'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}