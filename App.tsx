
import React, { useState } from 'react';
import Header from './components/Header';
import Scanner from './components/Scanner';
import Results from './components/Results';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [results, setResults] = useState<AnalysisResult[] | null>(null);

  const handleResults = (newResults: AnalysisResult[]) => {
    setResults(newResults);
  };

  const resetScanner = () => {
    setResults(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {!results ? (
          <div className="relative py-12">
            {/* Background Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-[120px] rounded-full -z-10"></div>
            
            <div className="max-w-7xl mx-auto px-4 text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
                Purge Your Scripts. <br />Secure Your Server.
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                The world's most advanced FiveM security tool. Detect and remove Blum panels, 
                obfuscated ciphers, and remote code execution vulnerabilities in seconds.
              </p>
            </div>

            <Scanner onResultsReady={handleResults} />
          </div>
        ) : (
          <Results results={results} onReset={resetScanner} />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>© 2024 FiveM Guardian Security Engine. v2.4.0 Stable</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">API Reference</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Community Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
