import { useEffect, useState } from 'react';
import { getAdjustedCB, getPenalty, getVerifiedCB, getShips, getYears } from '../adapters/infrastructure/complianceService';
import { bank, apply, getAvailable, getRecords } from '../adapters/infrastructure/bankingService';
import { formatPenalty, gCO2eqToTonnes } from '../shared/units';

export default function BankingTab() {
  const [shipId, setShipId] = useState('SHIP-A');
  const [customShipId, setCustomShipId] = useState('');
  const [useCustomShip, setUseCustomShip] = useState(false);
  const [year, setYear] = useState(2025);
  const [ships, setShips] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [summary, setSummary] = useState<{ baseCB: number; bankedSurplus: number; adjustedCB: number } | null>(null);
  const [verified, setVerified] = useState<number | null>(null);
  const [available, setAvailable] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [penalty, setPenalty] = useState<{ penalty: number; consecutiveYears: number; verifiedCB: number } | null>(null);
  const [bankTonnes, setBankTonnes] = useState('0');
  const [applyTonnes, setApplyTonnes] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<{ cb_before: number; applied: number; cb_after: number } | null>(null);

  const currentShipId = useCustomShip ? customShipId : shipId;

  const refresh = async () => {
    if (!currentShipId.trim()) {
      setError('Please enter a ship ID');
      return;
    }
    setLoading(true);
    setError(null);
    setKpi(null);
    const [adj, ver, avail, recs, pen] = await Promise.all([
      getAdjustedCB(currentShipId, year),
      getVerifiedCB(currentShipId, year),
      getAvailable(currentShipId),
      getRecords(currentShipId),
      getPenalty(currentShipId, year)
    ]);
    setSummary(adj);
    setVerified(ver.verifiedCB);
    setAvailable(avail.total_gco2eq);
    setRecords(recs);
    setPenalty(pen);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [s, y] = await Promise.all([getShips(), getYears()]);
      setShips(s);
      setYears(y);
      if (s.length > 0 && !s.includes(shipId)) setShipId(s[0]);
      if (y.length > 0 && !y.includes(year)) setYear(y[0]);
    })();
  }, []);

  useEffect(() => {
    if (ships.length > 0 && years.length > 0) {
      refresh();
    }
  }, [shipId, year, ships, years]);

  const canBank = (verified ?? 0) > 0;
  const canApply = available > 0 && (summary?.adjustedCB ?? 0) < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Banking Operations</h3>
      </div>

      {/* Explanatory Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border-2 border-indigo-200">
        <h4 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <span className="text-xl">ℹ️</span> How Banking Works
        </h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Banking Surplus:</strong> When a ship has a positive compliance balance (surplus), it can bank this surplus for future use. Banked surplus can be applied to cover deficits in future years.</p>
          <p><strong>Applying Banked Surplus:</strong> If a ship has a deficit (negative compliance balance), it can apply previously banked surplus to reduce or eliminate the deficit and avoid penalties.</p>
          <p><strong>Key Metrics:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Base CB:</strong> The initial compliance balance before any banking adjustments</li>
            <li><strong>Banked Surplus:</strong> Total amount of surplus available from previous years</li>
            <li><strong>Adjusted CB:</strong> Compliance balance after applying banked surplus</li>
            <li><strong>Verified CB:</strong> The final verified compliance balance for the year</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-blue-700">Ship</label>
          <div className="flex gap-2 items-center">
            {useCustomShip ? (
              <input
                type="text"
                value={customShipId}
                onChange={(e) => setCustomShipId(e.target.value)}
                placeholder="Enter ship ID"
                className="px-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-48"
              />
            ) : (
              <select
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                className="px-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {ships.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setUseCustomShip(!useCustomShip)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-white border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all"
              title={useCustomShip ? 'Switch to dropdown' : 'Enter custom ship ID'}
            >
              {useCustomShip ? '📋' : '✏️'}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-blue-700">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all mt-5"
        >
          🔄 Refresh
        </button>
        </div>
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading...</div>}
      
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Base CB</div>
            <div className="text-xl font-bold text-gray-800">{gCO2eqToTonnes(summary.baseCB)}</div>
          </div>
          <div className="p-4 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Banked Surplus</div>
            <div className="text-xl font-bold text-gray-800">{gCO2eqToTonnes(summary.bankedSurplus)}</div>
          </div>
          <div className="p-4 border-2 border-purple-200 rounded-xl bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Adjusted CB</div>
            <div className="text-xl font-bold text-gray-800">{gCO2eqToTonnes(summary.adjustedCB)}</div>
          </div>
          <div className="p-4 border-2 border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Verified CB</div>
            <div className="text-xl font-bold text-gray-800">{verified == null ? 'n/a' : gCO2eqToTonnes(verified)}</div>
          </div>
        </div>
      )}

      <div className="text-sm">
        <span className="font-medium">Available to bank this year:</span>{' '}
        {verified == null ? 'n/a' : gCO2eqToTonnes(Math.max(verified, 0))}
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200">
          <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💰</span> Bank Surplus
          </h4>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="number"
              min="0"
              value={bankTonnes}
              onChange={(e) => setBankTonnes(e.target.value)}
              placeholder="Amount to bank (tonnes)"
              disabled={!canBank}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm w-48 disabled:opacity-50"
            />
            <button
              disabled={!canBank}
              onClick={async () => {
                try {
                  setError(null);
                  const grams = Number(bankTonnes) * 1_000_000;
                  await bank({ shipId: currentShipId, year, amount_gco2eq: grams });
                  setBankTonnes('0');
                  refresh();
                } catch (e: any) {
                  setError(e?.message || 'Failed to bank surplus');
                }
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${canBank ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              💾 Bank Surplus
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-white p-5 rounded-xl border-2 border-green-200">
          <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="text-xl">✅</span> Apply Banked Surplus to Deficit
          </h4>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="number"
              min="0"
              value={applyTonnes}
              onChange={(e) => setApplyTonnes(e.target.value)}
              placeholder="Amount to apply (tonnes)"
              disabled={!canApply}
              className="px-3 py-2 border border-neutral-300 rounded-md text-sm w-48 disabled:opacity-50"
            />
            <button
              disabled={!canApply}
              onClick={async () => {
                try {
                  setError(null);
                  const grams = Number(applyTonnes) * 1_000_000;
                  if (grams > available) {
                    setError(`Amount exceeds available banked surplus: ${gCO2eqToTonnes(available)}`);
                    return;
                  }
                  const result = await apply({ shipId: currentShipId, year, amount_gco2eq: grams });
                  setKpi(result);
                  setApplyTonnes('0');
                  refresh();
                } catch (e: any) {
                  setError(e?.message || 'Failed to apply banked surplus');
                }
              }}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${canApply ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              ⚡ Apply Now
            </button>
          </div>
          {!canApply && available > 0 && (
            <div className="text-xs text-neutral-500 mt-1">No deficit to apply surplus to</div>
          )}
          {!canApply && available <= 0 && (
            <div className="text-xs text-neutral-500 mt-1">No banked surplus available</div>
          )}
        </div>
      </div>

      {kpi && (
        <div className="p-5 border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-lg">
          <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="text-xl">📊</span> Application Result (KPIs)
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-neutral-600">CB Before</div>
              <div className="font-medium">{gCO2eqToTonnes(kpi.cb_before)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-600">Applied</div>
              <div className="font-medium text-green-700">{gCO2eqToTonnes(kpi.applied)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-600">CB After</div>
              <div className="font-medium">{gCO2eqToTonnes(kpi.cb_after)}</div>
            </div>
          </div>
        </div>
      )}

      {penalty && penalty.verifiedCB < 0 && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
          <div className="text-sm">
            Penalty: <span className="font-medium">{formatPenalty(penalty.penalty)}</span>
          </div>
          <div className="text-xs text-red-700">Consecutive deficit years: {penalty.consecutiveYears}</div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-xl border-2 border-blue-200">
        <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
          <span className="text-xl">📜</span> Banked History
        </h4>
        <ul className="space-y-1 text-sm">
          {records.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-neutral-500">{r.year_banked}:</span>
              <span>{gCO2eqToTonnes(Number(r.amount_gco2eq))}</span>
              <span className="text-neutral-500">
                (remaining {gCO2eqToTonnes(Number(r.remaining_gco2eq))})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}