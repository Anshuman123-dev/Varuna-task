import { useEffect, useState } from 'react';
import { createPool, listPools } from '../adapters/infrastructure/poolingService';
import { gCO2eqToTonnes } from '../shared/units';
import { getAdjustedCB } from '../adapters/infrastructure/complianceService';

type Member = { shipId: string; year: number; adjusted?: number };

export default function PoolingTab() {
  const [year, setYear] = useState(2025);
  const [members, setMembers] = useState<Member[]>([{ shipId: 'SHIP-A', year }]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPools = async () => {
    const list = await listPools(year);
    setPools(list);
  };

  useEffect(() => {
    refreshPools();
  }, [year]);

  const refreshAdjusted = async () => {
    const updated: Member[] = [];
    for (const m of members) {
      const adj = await getAdjustedCB(m.shipId, m.year);
      updated.push({ ...m, adjusted: adj.adjustedCB });
    }
    setMembers(updated);
  };

  const sum = members.reduce((s, m) => s + (m.adjusted ?? 0), 0);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Pooling</h3>
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm w-32"
        />
        <button
          onClick={refreshAdjusted}
          className="px-3 py-2 rounded-md border text-sm bg-white border-neutral-300 hover:bg-neutral-100"
        >
          Fetch Adjusted CB
        </button>
      </div>
      {members.map((m, idx) => (
        <div key={idx} className="flex flex-wrap items-center gap-2">
          <input
            value={m.shipId}
            onChange={(e) =>
              setMembers((prev) => prev.map((pm, i) => (i === idx ? { ...pm, shipId: e.target.value } : pm)))
            }
            placeholder="Ship ID"
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm"
          />
          <input
            type="number"
            value={m.year}
            onChange={(e) =>
              setMembers((prev) => prev.map((pm, i) => (i === idx ? { ...pm, year: Number(e.target.value) } : pm)))
            }
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm w-32"
          />
          <span className="text-sm">
            Adjusted: <span className="font-medium">{m.adjusted == null ? '-' : gCO2eqToTonnes(m.adjusted)}</span>
          </span>
        </div>
      ))}
      <button
        onClick={() => setMembers((p) => [...p, { shipId: '', year }])}
        className="px-3 py-2 rounded-md border text-sm bg-white border-neutral-300 hover:bg-neutral-100"
      >
        Add Member
      </button>
      <div className="text-sm">
        Pool Sum: <span className="font-medium">{gCO2eqToTonnes(sum)}</span>{' '}
        {sum >= 0 ? <span className="text-green-700">✅</span> : <span className="text-red-700">❌</span>}
      </div>
      <div>
        <button
          disabled={sum < 0 || members.length === 0}
          onClick={async () => {
            setLoading(true);
            const res = await createPool({ year, members: members.map((m) => ({ shipId: m.shipId, year: m.year })) });
            setLoading(false);
            await refreshPools();
            alert(`Pool ${res.poolId} created`);
          }}
          className={`px-3 py-2 rounded-md border text-sm ${sum < 0 || members.length === 0 ? 'bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-blue-600 border-blue-700 text-white'}`}
        >
          {loading ? 'Creating...' : 'Create Pool'}
        </button>
      </div>

      <div>
        <h4 className="text-base font-medium mb-2">Existing Pools</h4>
        <ul className="space-y-1 text-sm">
          {pools.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="font-medium">Pool #{p.id}</span>
              <span className="text-neutral-500">(Y{p.year})</span>
              <span>—</span>
              <span>Adjusted {gCO2eqToTonnes(Number(p.total_adjusted_cb_gco2eq || 0))}</span>
              <span>/ Verified {gCO2eqToTonnes(Number(p.total_verified_cb_gco2eq || 0))}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


