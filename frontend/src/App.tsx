import { useState, useEffect } from 'react';
import './App.css';
import RoutesTab from './components/RoutesTab';
import BankingTab from './components/BankingTab';
import PoolingTab from './components/PoolingTab';
import CompareTab from './components/CompareTab';
import FallbackNotification from './components/FallbackNotification';

function App() {
  const [tab, setTab] = useState<'routes' | 'compare' | 'banking' | 'pooling'>('routes');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const handleFallback = () => setShowFallback(true);
    window.addEventListener('fallback-data-used', handleFallback);
    return () => window.removeEventListener('fallback-data-used', handleFallback);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <FallbackNotification show={showFallback} />
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">⚓ FuelEU Maritime Compliance</h1>
          <p className="text-blue-100 text-sm">Banking & Pooling Dashboard - Articles 20 & 21</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 mb-6 p-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab('routes')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'routes'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              📊 Routes
            </button>
            <button
              onClick={() => setTab('compare')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'compare'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              📈 Compare
            </button>
            <button
              onClick={() => setTab('banking')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'banking'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              🏦 Banking
            </button>
            <button
              onClick={() => setTab('pooling')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'pooling'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              🤝 Pooling
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
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
