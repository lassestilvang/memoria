import { Interviewer } from './components/Interviewer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl animate-subtle-float">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 font-display">
            Memoria
          </h1>
          <p className="text-2xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Your stories are treasures. <br />
            Let's preserve them together.
          </p>
        </header>

        <main>
          <Interviewer />
        </main>
      </div>
    </div>
  );
}

export default App;
