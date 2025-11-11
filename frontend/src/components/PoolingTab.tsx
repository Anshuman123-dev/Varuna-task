import { useEffect, useState } from 'react';
import { createPool, listPools } from '../adapters/infrastructure/poolingService';
import { gCO2eqToTonnes } from '../shared/units';
import { getAdjustedCB } from '../adapters/infrastructure/complianceService';

type Member = { shipId: string; year: number; adjusted?: number };
type PoolResult = { poolId: number; members: { shipId: string; adjusted: number; verified: number }[] };

export default function PoolingTab() {
  const [year, setYear] = useState(2025);
  const [members, setMembers] = useState<Member[]>([{ shipId: 'SHIP-A', year }]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PoolResult | null>(null);

  const refreshPools = async () => {
    const list = await listPools(year);
    setPools(list);
  };

  useEffect(() => {
    refreshPools();
  }, [year]);

  const refreshAdjusted = async () => {
    try {
      setError(null);
      setLoading(true);
      const updated: Member[] = [];
      for (const m of members) {
        const adj = await getAdjustedCB(m.shipId, m.year);
        updated.push({ ...m, adjusted: adj.adjustedCB });
      }
      setMembers(updated);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch adjusted CB');
    } finally {
      setLoading(false);
    }
  };

  const sum = members.reduce((s, m) => s + (m.adjusted ?? 0), 0);
  const isValid = sum >= 0 && members.length > 0 && members.every(m => m.adjusted != null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Pooling Operations</h3>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex flex-wrap gap-3 items-center">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={refreshAdjusted}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50"
        >
          {loading ? '⏳ Loading...' : '📥 Fetch Adjusted CB'}
        </button>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200">
        <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
          <span className="text-xl">👥</span> Pool Members
        </h4>
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 p-4 border-2 border-blue-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <input
                value={m.shipId}
                onChange={(e) =>
                  setMembers((prev) => prev.map((pm, i) => (i === idx ? { ...pm, shipId: e.target.value } : pm)))
                }
                placeholder="Ship ID"
                className="px-3 py-2 border-2 border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                value={m.year}
                onChange={(e) =>
                  setMembers((prev) => prev.map((pm, i) => (i === idx ? { ...pm, year: Number(e.target.value) } : pm)))
                }
                className="px-3 py-2 border-2 border-blue-200 rounded-lg text-sm font-medium w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex-1 text-sm">
                <span className="text-neutral-600">Adjusted CB: </span>
                <span className={`font-medium ${m.adjusted == null ? '' : m.adjusted >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {m.adjusted == null ? 'Not fetched' : gCO2eqToTonnes(m.adjusted)}
                </span>
              </div>
              <button
                onClick={() => setMembers((prev) => prev.filter((_, i) => i !== idx))}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              >
                ❌ Remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setMembers((p) => [...p, { shipId: '', year }])}
          className="mt-3 px-4 py-2 rounded-lg border-2 border-blue-300 text-sm font-medium bg-white hover:bg-blue-50 hover:border-blue-400 transition-all"
        >
          ➕ Add Member
        </button>
      </div>

      <div className="p-5 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-white shadow-sm">
        <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
          <span className="text-xl">✓</span> Pool Validation
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={sum >= 0 ? 'text-green-700' : 'text-red-700'}>
              {sum >= 0 ? '✅' : '❌'}
            </span>
            <span>Pool Sum: <span className="font-medium">{gCO2eqToTonnes(sum)}</span></span>
            <span className="text-neutral-500">(must be ≥ 0)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={members.length > 0 ? 'text-green-700' : 'text-red-700'}>
              {members.length > 0 ? '✅' : '❌'}
            </span>
            <span>Members: <span className="font-medium">{members.length}</span></span>
            <span className="text-neutral-500">(at least 1 required)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={members.every(m => m.adjusted != null) ? 'text-green-700' : 'text-red-700'}>
              {members.every(m => m.adjusted != null) ? '✅' : '❌'}
            </span>
            <span>All Adjusted CB fetched</span>
          </div>
        </div>
      </div>

      <button
        disabled={!isValid || loading}
        onClick={async () => {
          try {
            setError(null);
            setLoading(true);
            const res = await createPool({ year, members: members.map((m) => ({ shipId: m.shipId, year: m.year })) });
            setResult(res);
            await refreshPools();
          } catch (e: any) {
            setError(e?.message || 'Failed to create pool');
          } finally {
            setLoading(false);
          }
        }}
        className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
          isValid && !loading
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? '⏳ Creating Pool...' : '🚀 Create Pool'}
      </button>

      {result && (
        <div className="p-6 border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-lg">
          <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎉</span> Pool #{result.poolId} Created Successfully!
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-green-300 bg-green-100">
                  <th className="text-left py-2 px-2">Ship ID</th>
                  <th className="text-right py-2 px-2">CB Before (Adjusted)</th>
                  <th className="text-right py-2 px-2">CB After (Verified)</th>
                  <th className="text-right py-2 px-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {result.members.map((m, idx) => {
                  const change = m.verified - m.adjusted;
                  return (
                    <tr key={idx} className="border-b border-green-100">
                      <td className="py-2 px-2 font-medium">{m.shipId}</td>
                      <td className={`text-right py-2 px-2 ${m.adjusted >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {gCO2eqToTonnes(m.adjusted)}
                      </td>
                      <td className={`text-right py-2 px-2 font-medium ${m.verified >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {gCO2eqToTonnes(m.verified)}
                      </td>
                      <td className={`text-right py-2 px-2 ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {change >= 0 ? '+' : ''}{gCO2eqToTonnes(change)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200">
        <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span> Existing Pools (Year {year})
        </h4>
        {pools.length === 0 ? (
          <div className="text-sm text-neutral-500">No pools found for this year</div>
        ) : (
          <ul className="space-y-2">
            {pools.map((p) => (
              <li key={p.id} className="p-4 border-2 border-blue-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">Pool #{p.id}</span>
                  <span className="text-neutral-500">Year {p.year}</span>
                  <span className="text-neutral-400">|</span>
                  <span>Adjusted: {gCO2eqToTonnes(Number(p.total_adjusted_cb_gco2eq || 0))}</span>
                  <span className="text-neutral-400">→</span>
                  <span>Verified: {gCO2eqToTonnes(Number(p.total_verified_cb_gco2eq || 0))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


