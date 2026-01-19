
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { analyzeScript } from '../services/scriptAnalyzer';
import { AnalysisResult, ScanMode } from '../types';

interface ScannerProps {
  onResultsReady: (results: AnalysisResult[]) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onResultsReady }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<ScanMode>(ScanMode.STANDARD);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processBatch = async (tasks: { name: string; content: string }[]) => {
    const results: AnalysisResult[] = [];
    // Super-charged concurrency for Turbo (Gemini Flash)
    const concurrencyLimit = mode === ScanMode.TURBO ? 12 : mode === ScanMode.SUPER_PRO ? 2 : 5;
    
    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const batch = tasks.slice(i, i + concurrencyLimit);
      setScanProgress(`FLASH ENGINE: Auditing Batch ${Math.ceil(i/concurrencyLimit) + 1}...`);
      
      const batchResults = await Promise.all(
        batch.map(async (task) => {
          try {
            return await analyzeScript(task.name, task.content, mode);
          } catch (err) {
            console.error(err);
            return null;
          }
        })
      );
      
      results.push(...(batchResults.filter(r => r !== null) as AnalysisResult[]));
      setProgress(Math.round(((i + batch.length) / tasks.length) * 100));
    }
    return results;
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setIsScanning(true);
    setProgress(0);
    const scriptTasks: { name: string; content: string }[] = [];

    setScanProgress('Initializing High-Speed Cache...');
    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith('.lua')) {
        scriptTasks.push({ name: file.name, content: await file.text() });
      } else if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await new JSZip().loadAsync(file);
        const zipFiles = Object.keys(zip.files).filter(path => path.toLowerCase().endsWith('.lua') && !zip.files[path].dir);
        for (const path of zipFiles) {
          scriptTasks.push({ name: `${file.name}/${path}`, content: await zip.files[path].async('text') });
        }
      }
    }
    
    if (scriptTasks.length === 0) {
      setIsScanning(false);
      return;
    }

    const finalResults = await processBatch(scriptTasks);
    onResultsReady(finalResults);
    setIsScanning(false);
  };

  const modes = [
    { id: ScanMode.TURBO, label: 'TURBO', icon: '⚡', color: 'emerald', desc: 'Gemini Flash 12x' },
    { id: ScanMode.STANDARD, label: 'STANDARD', icon: '🛡️', color: 'slate', desc: 'Balanced Audit' },
    { id: ScanMode.SUPER_PRO, label: 'SUPER PRO', icon: '💎', color: 'purple', desc: 'Gemini Pro Elite' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Mode Selection */}
      <div className="flex justify-center mb-12 space-x-4">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            disabled={isScanning}
            className={`flex-1 p-5 rounded-3xl border transition-all flex flex-col items-center group relative overflow-hidden ${
              mode === m.id 
                ? `border-${m.color}-500 bg-${m.color}-500/10 ring-2 ring-${m.color}-500/20` 
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            {m.id === ScanMode.TURBO && <div className="absolute top-0 right-0 p-1"><span className="text-[8px] bg-emerald-500 text-black px-1 font-black">FAST</span></div>}
            <span className="text-3xl mb-1">{m.icon}</span>
            <span className={`text-sm font-black tracking-tighter ${mode === m.id ? 'text-white' : 'text-slate-500'}`}>{m.label}</span>
            <span className="text-[10px] text-slate-600 uppercase font-mono mt-1">{m.desc}</span>
          </button>
        ))}
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-[4rem] p-24 transition-all duration-700 flex flex-col items-center justify-center text-center group overflow-hidden ${
          dragActive ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
        } ${isScanning ? 'cursor-wait pointer-events-none' : 'cursor-pointer shadow-2xl'}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files && handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept=".lua,.zip" onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />

        {isScanning ? (
          <div className="w-full max-w-sm">
            <div className="relative w-40 h-40 mx-auto mb-12">
              <div className={`absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin duration-[0.4s] ${mode === ScanMode.TURBO ? 'border-t-yellow-400' : ''}`}></div>
              <div className={`absolute inset-4 border-2 border-slate-800 rounded-full flex items-center justify-center bg-slate-950/50 backdrop-blur-md`}>
                <span className="font-mono font-black text-3xl text-white">{progress}%</span>
              </div>
            </div>
            <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse mb-8">{scanProgress}</p>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className={`w-24 h-24 rounded-[2rem] mb-10 flex items-center justify-center transition-all duration-700 shadow-3xl transform group-hover:rotate-6 ${
              mode === ScanMode.SUPER_PRO ? 'bg-purple-600 shadow-purple-600/40' : 
              mode === ScanMode.TURBO ? 'bg-emerald-500 shadow-emerald-500/40' : 
              'bg-slate-700 shadow-slate-700/40'
            }`}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
            </div>
            <h3 className="text-5xl font-black mb-6 text-white uppercase tracking-tighter leading-tight">Engage {mode.replace('_', ' ')}<br/><span className="text-emerald-500 italic">Forensic Engine</span></h3>
            <p className="text-slate-400 max-w-sm mb-12 text-xl leading-relaxed font-medium">Inject your scripts into the high-velocity security firewall.</p>
            <button className="px-16 py-6 bg-white text-slate-950 font-black rounded-[2rem] hover:bg-emerald-400 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-white/10 hover:scale-110 active:scale-95">
              Analyze Payloads
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Scanner;
