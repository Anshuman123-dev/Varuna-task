import { useState } from 'react';
import './App.css';
import RoutesTab from './components/RoutesTab';
import BankingTab from './components/BankingTab';
import PoolingTab from './components/PoolingTab';
import CompareTab from './components/CompareTab';

function App() {
  const [tab, setTab] = useState<'routes' | 'compare' | 'banking' | 'pooling'>('routes');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Fuel EU Compliance Dashboard</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setTab('routes')}
            className={`px-3 py-2 rounded-md border text-sm ${tab === 'routes' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-neutral-300 hover:bg-neutral-100'}`}
          >
            Routes
          </button>
          <button
            onClick={() => setTab('compare')}
            className={`px-3 py-2 rounded-md border text-sm ${tab === 'compare' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-neutral-300 hover:bg-neutral-100'}`}
          >
            Compare
          </button>
          <button
            onClick={() => setTab('banking')}
            className={`px-3 py-2 rounded-md border text-sm ${tab === 'banking' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-neutral-300 hover:bg-neutral-100'}`}
          >
            Banking
          </button>
          <button
            onClick={() => setTab('pooling')}
            className={`px-3 py-2 rounded-md border text-sm ${tab === 'pooling' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-neutral-300 hover:bg-neutral-100'}`}
          >
            Pooling
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
          {tab === 'routes' && <RoutesTab />}
          {tab === 'compare' && <CompareTab />}
          {tab === 'banking' && <BankingTab />}
          {tab === 'pooling' && <PoolingTab />}
        </div>
      </div>
    </div>
  )
}

export default App
