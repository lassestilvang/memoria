import { Interviewer } from './components/Interviewer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Memoria
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Your personal AI biographer. preserving your stories for generations.
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
