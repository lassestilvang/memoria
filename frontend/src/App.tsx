import { useState } from 'react';
import { Interviewer } from './components/Interviewer';
import { FamilyDashboard } from './components/FamilyDashboard';
import { Storybook } from './components/Storybook';

function App() {
  const [view, setView] = useState<'elder' | 'family' | 'storybook'>('elder');

  return (
    <div className="min-h-screen pt-12 pb-24 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="text-center mb-20 relative reveal-1">
          {/* View Toggle */}
          <div className="inline-flex p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-12 backdrop-blur-md">
            <button
              onClick={() => setView('elder')}
              className={`px-8 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${view === 'elder'
                ? 'bg-gold text-midnight shadow-lg shadow-gold/20'
                : 'text-silver/40 hover:text-white hover:bg-white/5'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Elder
            </button>
            <button
              onClick={() => setView('family')}
              className={`px-8 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${view === 'family' || view === 'storybook'
                ? 'bg-gold text-midnight shadow-lg shadow-gold/20'
                : 'text-silver/40 hover:text-white hover:bg-white/5'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Family
            </button>
          </div>

          <h1 className="text-6xl md:text-9xl font-display text-gradient mb-8 italic">
            {view === 'elder' ? 'Memoria' : (view === 'family' ? 'Review Hub' : 'Audible Storybook')}
          </h1>
          <p className="text-xl md:text-3xl text-silver/30 font-light tracking-widest italic reveal-2">
            {view === 'elder'
              ? "Your stories are treasures. Let's preserve them together."
              : (view === 'family'
                ? "Help refine your family's life story. Approve recent captures below."
                : "A journey through shared memories and original voices.")}
          </p>
        </header>

        <main className="relative z-10">
          {view === 'elder' && <Interviewer />}
          {view === 'family' && <FamilyDashboard onOpenStorybook={() => setView('storybook')} />}
          {view === 'storybook' && <Storybook onBack={() => setView('family')} />}
        </main>
      </div>
    </div>
  );
}

export default App;
