import { useEffect, useState } from 'react';
import { getRoutes, getComparison, createRoute, setBaseline } from '../adapters/infrastructure/routesService';
import { gramsToTonnes } from '../shared/units';

export default function RoutesTab() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [comparison, setComparison] = useState<{ baseline: any | null; others: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterFuel, setFilterFuel] = useState<string>('all');
  const [filterVessel, setFilterVessel] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({
    route_id: '',
    vessel_type: '',
    fuel_type: '',
    year: '',
    ghg_intensity: '',
    fuel_consumption_t: '',
    distance_km: '',
    ops_energy_mj: '',
    lcv_mj_per_g: ''
  });
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [r, c] = await Promise.all([getRoutes(), getComparison()]);
    setRoutes(r);
    setComparison(c);
    setLoading(false);
  };

  const handleSetBaseline = async (routeId: number) => {
    try {
      await setBaseline(routeId);
      await loadData();
    } catch (error) {
      console.error('Failed to set baseline:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRoutes = routes
    .filter(r => filterFuel === 'all' || r.fuel_type === filterFuel)
    .filter(r => filterVessel === 'all' || r.vessel_type === filterVessel)
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aVal < bVal ? -direction : direction;
    });

  const fuelTypes = ['all', ...new Set(routes.map(r => r.fuel_type))];
  const vesselTypes = ['all', ...new Set(routes.map(r => r.vessel_type))];

  const totalFuel = filteredAndSortedRoutes.reduce((sum, r) => sum + Number(r.fuel_consumption_g || 0), 0);
  const totalDistance = filteredAndSortedRoutes.reduce((sum, r) => sum + Number(r.distance_km || 0), 0);
  const avgGHGI = filteredAndSortedRoutes.length > 0 
    ? filteredAndSortedRoutes.reduce((sum, r) => sum + Number(r.ghg_intensity || 0), 0) / filteredAndSortedRoutes.length 
    : 0;
  
  const totalFuelInTonnes = Number(gramsToTonnes(totalFuel));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-neutral-600">Loading routes data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-neutral-900">Routes Overview</h3>
          <p className="text-sm text-neutral-500 mt-1">{routes.length} total routes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Add Route
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Fuel</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalFuelInTonnes.toFixed(1)}</p>
              <p className="text-xs text-blue-700 mt-0.5">tonnes</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Distance</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{totalDistance.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-0.5">kilometers</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Avg GHG Intensity</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{avgGHGI.toFixed(1)}</p>
              <p className="text-xs text-purple-700 mt-0.5">gCO₂e/MJ</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Filter by Fuel Type</label>
            <select 
              value={filterFuel} 
              onChange={(e) => setFilterFuel(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fuelTypes.map(f => (
                <option key={f} value={f}>{f === 'all' ? 'All Fuels' : f}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Filter by Vessel Type</label>
            <select 
              value={filterVessel} 
              onChange={(e) => setFilterVessel(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {vesselTypes.map(v => (
                <option key={v} value={v}>{v === 'all' ? 'All Vessels' : v}</option>
              ))}
            </select>
          </div>
          {(filterFuel !== 'all' || filterVessel !== 'all') && (
            <div className="flex items-end">
              <button 
                onClick={() => { setFilterFuel('all'); setFilterVessel('all'); }}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                {[
                  { key: 'route_id', label: 'Route ID' },
                  { key: 'vessel_type', label: 'Vessel' },
                  { key: 'fuel_type', label: 'Fuel' },
                  { key: 'year', label: 'Year' },
                  { key: 'ghg_intensity', label: 'GHGI (gCO₂e/MJ)' },
                  { key: 'fuel_consumption_g', label: 'Fuel (t)' },
                  { key: 'distance_km', label: 'Distance (km)' },
                  { key: 'total_emissions_t', label: 'Total Emissions (t)' },
                  { key: 'is_baseline', label: 'Baseline' },
                  { key: 'actions', label: 'Actions' }
                ].map(({ key, label }) => (
                  <th 
                    key={key}
                    onClick={() => key !== 'actions' && handleSort(key)}
                    className={`text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider ${key !== 'actions' ? 'cursor-pointer hover:bg-neutral-100' : ''} transition-colors select-none`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {sortField === key && key !== 'actions' && (
                        <svg className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {filteredAndSortedRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">{r.route_id}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{r.vessel_type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {r.fuel_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{r.year}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{r.ghg_intensity}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{Number(gramsToTonnes(Number(r.fuel_consumption_g || 0))).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{Number(r.distance_km || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{r.total_emissions_t != null ? Number(r.total_emissions_t).toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.is_baseline ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {!r.is_baseline && (
                      <button
                        onClick={() => handleSetBaseline(r.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Set as Baseline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedRoutes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-sm text-neutral-500">No routes match your filters</p>
          </div>
        )}
      </div>

      {/* Baseline Comparison */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <h4 className="text-lg font-semibold text-neutral-900">Baseline Comparison</h4>
          <p className="text-xs text-neutral-500 mt-1">Performance comparison against baseline route</p>
        </div>
        
        {!comparison?.baseline ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-neutral-900">No baseline set</p>
            <p className="text-xs text-neutral-500 mt-1">Select a route as baseline to enable comparisons</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                  Baseline
                </span>
                <span className="text-sm font-medium text-neutral-900">{comparison.baseline.route_id}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Route</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Vessel</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">Fuel</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">% Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {comparison.others.map((o: any, i: number) => {
                    const diff = o.percentDiff;
                    const isPositive = diff > 0;
                    const isNeutral = Math.abs(diff) < 1;
                    return (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-neutral-900">{o.route.route_id}</td>
                        <td className="px-6 py-4 text-sm text-neutral-700">{o.route.vessel_type}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {o.route.fuel_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                            isNeutral ? 'bg-neutral-100 text-neutral-800' :
                            isPositive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(diff).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">Add Route</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError('');
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {formError}
              </div>
            )}
            <form>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Route ID *</label>
                  <input 
                    type="text" 
                    value={form.route_id} 
                    onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Vessel Type</label>
                  <input 
                    type="text" 
                    value={form.vessel_type} 
                    onChange={(e) => setForm({ ...form, vessel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Fuel Type</label>
                  <input 
                    type="text" 
                    value={form.fuel_type} 
                    onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Year</label>
                  <input 
                    type="number" 
                    value={form.year} 
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">GHG Intensity (gCO₂e/MJ)</label>
                  <input 
                    type="number" 
                    value={form.ghg_intensity} 
                    onChange={(e) => setForm({ ...form, ghg_intensity: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Fuel Consumption (t)</label>
                  <input 
                    type="number" 
                    value={form.fuel_consumption_t} 
                    onChange={(e) => setForm({ ...form, fuel_consumption_t: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Distance (km)</label>
                  <input 
                    type="number" 
                    value={form.distance_km} 
                    onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">Ops Energy (MJ)</label>
                  <input 
                    type="number" 
                    value={form.ops_energy_mj} 
                    onChange={(e) => setForm({ ...form, ops_energy_mj: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">LCV (MJ/g)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={form.lcv_mj_per_g} 
                    onChange={(e) => setForm({ ...form, lcv_mj_per_g: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="submit" 
                  onClick={(e) => {
                    e.preventDefault();
                    setFormError('');
                    
                    if (!form.route_id || form.route_id.trim() === '') {
                      setFormError('Route ID is required');
                      return;
                    }
                    
                    const payload = {
                      route_id: form.route_id.trim(),
                      vessel_type: form.vessel_type || null,
                      fuel_type: form.fuel_type || null,
                      year: form.year ? Number(form.year) : null,
                      ghg_intensity: form.ghg_intensity ? Number(form.ghg_intensity) : null,
                      fuel_consumption_g: form.fuel_consumption_t ? Number(form.fuel_consumption_t) * 1_000_000 : null,
                      distance_km: form.distance_km ? Number(form.distance_km) : null,
                      ops_energy_mj: form.ops_energy_mj ? Number(form.ops_energy_mj) : null,
                      lcv_mj_per_g: form.lcv_mj_per_g ? Number(form.lcv_mj_per_g) : null
                    };
                    
                    createRoute(payload)
                      .then(async () => {
                        const r = await getRoutes();
                        setRoutes(r);
                        setShowModal(false);
                        setFormError('');
                        setForm({
                          route_id: '',
                          vessel_type: '',
                          fuel_type: '',
                          year: '',
                          ghg_intensity: '',
                          fuel_consumption_t: '',
                          distance_km: '',
                          ops_energy_mj: '',
                          lcv_mj_per_g: ''
                        });
                      })
                      .catch((err) => {
                        setFormError(err.message || 'Failed to create route. Please try again.');
                      });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Add Route
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}