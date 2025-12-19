import { useState } from 'react';
import { Interviewer } from './components/Interviewer';
import { FamilyDashboard } from './components/FamilyDashboard';

function App() {
  const [view, setView] = useState<'elder' | 'family'>('elder');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl animate-subtle-float">
        <header className="text-center mb-16 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex bg-white p-2 rounded-2xl shadow-xl border border-slate-100 mb-8">
            <button
              onClick={() => setView('elder')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${view === 'elder' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Elder
            </button>
            <button
              onClick={() => setView('family')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${view === 'family' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Family
            </button>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 font-display">
            {view === 'elder' ? 'Memoria' : 'Review Hub'}
          </h1>
          <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            {view === 'elder'
              ? <>Your stories are treasures. <br /> Let's preserve them together.</>
              : <>Help refine Lasse's life story. <br /> Approve his recent memories below.</>
            }
          </p>
        </header>

        <main>
          {view === 'elder' ? <Interviewer /> : <FamilyDashboard />}
        </main>
      </div>
    </div>
  );
}

export default App;
