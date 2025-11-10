import { useEffect, useState } from 'react';
import { getAdjustedCB, getPenalty, getVerifiedCB } from '../adapters/infrastructure/complianceService';
import { bank, getAvailable, getRecords } from '../adapters/infrastructure/bankingService';
import { formatPenalty, gCO2eqToTonnes } from '../shared/units';

export default function BankingTab() {
  const [shipId, setShipId] = useState('SHIP-A');
  const [year, setYear] = useState(2025);
  const [summary, setSummary] = useState<{ baseCB: number; bankedSurplus: number; adjustedCB: number } | null>(null);
  const [verified, setVerified] = useState<number | null>(null);
  const [available, setAvailable] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [penalty, setPenalty] = useState<{ penalty: number; consecutiveYears: number; verifiedCB: number } | null>(null);
  const [bankTonnes, setBankTonnes] = useState('0');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [adj, ver, avail, recs, pen] = await Promise.all([
      getAdjustedCB(shipId, year),
      getVerifiedCB(shipId, year),
      getAvailable(shipId),
      getRecords(shipId),
      getPenalty(shipId, year)
    ]);
    setSummary(adj);
    setVerified(ver.verifiedCB);
    setAvailable(avail.total_gco2eq);
    setRecords(recs);
    setPenalty(pen);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [shipId, year]);

  const canBank = (verified ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h3 className="text-3xl font-bold text-slate-800 mb-6">Carbon Banking Dashboard</h3>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-2">SHIP ID</label>
              <input
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                placeholder="Enter Ship ID"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-600 mb-2">YEAR</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="mt-6 px-6 py-3 rounded-xl border-2 text-sm font-semibold bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⟳ Loading...' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base CB</div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{gCO2eqToTonnes(summary.baseCB)}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banked Surplus</div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{gCO2eqToTonnes(summary.bankedSurplus)}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjusted CB</div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">⚖️</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">{gCO2eqToTonnes(summary.adjustedCB)}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified CB</div>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-lg">✓</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {verified == null ? 'N/A' : gCO2eqToTonnes(verified)}
              </div>
            </div>
          </div>
        )}

        {/* Banking Action Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-semibold text-slate-700">Available to bank this year:</span>
              <span className="text-lg font-bold text-blue-600">
                {verified == null ? 'N/A' : gCO2eqToTonnes(Math.max(verified, 0))}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold text-slate-600 mb-2">AMOUNT TO BANK (TONNES)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bankTonnes}
                onChange={(e) => setBankTonnes(e.target.value)}
                placeholder="Enter amount in tonnes"
                disabled={!canBank}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              disabled={!canBank}
              onClick={async () => {
                const grams = Number(bankTonnes) * 1_000_000;
                await bank({ shipId, year, amount_gco2eq: grams });
                setBankTonnes('0');
                refresh();
              }}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                canBank
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              🏦 Bank Carbon
            </button>
          </div>
        </div>

        {/* Penalty Alert */}
        {penalty && penalty.verifiedCB < 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-red-900 mb-2">Penalty Applied</h4>
                <div className="text-2xl font-bold text-red-600 mb-2">{formatPenalty(penalty.penalty)}</div>
                <div className="text-sm text-red-700 bg-red-50 inline-block px-3 py-1 rounded-lg">
                  Consecutive deficit years: <span className="font-bold">{penalty.consecutiveYears}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banking History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>📜</span> Banking History
          </h4>
          {records.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-sm">No banking records found</div>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                      {r.year_banked}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-600">Banked Amount</div>
                      <div className="text-lg font-bold text-slate-800">{gCO2eqToTonnes(Number(r.amount_gco2eq))}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Remaining</div>
                    <div className="text-base font-bold text-green-600">{gCO2eqToTonnes(Number(r.remaining_gco2eq))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}