
import React, { useState } from 'react';
import JSZip from 'jszip';
import { AnalysisResult, SecurityIssue, ThreatLevel, ScanMode } from '../types';
import { getAIExpertAnalysis } from '../services/geminiService';

interface ResultsProps {
  results: AnalysisResult[];
  onReset: () => void;
}

const Results: React.FC<ResultsProps> = ({ results, onReset }) => {
  const [selectedFile, setSelectedFile] = useState<AnalysisResult | null>(results[0] || null);
  const [issueAnalyses, setIssueAnalyses] = useState<Record<string, string>>({});
  const [loadingIssues, setLoadingIssues] = useState<Set<string>>(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const totalIssues = results.reduce((acc, curr) => acc + curr.issues.length, 0);
  const criticalIssues = results.reduce((acc, curr) => acc + curr.issues.filter(i => i.threatLevel === ThreatLevel.CRITICAL).length, 0);

  const downloadAllAsZip = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    results.forEach((res) => {
      const safeName = res.fileName.replace(/^.*[\\\/]/, '');
      zip.file(`CLEANED_${safeName}`, res.cleanedContent);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `FiveM_Guardian_Shield_${new Date().getTime()}.zip`;
    link.click();
    setIsZipping(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-700">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Payloads Verified</p>
          <h3 className="text-4xl font-black text-white">{results.length}</h3>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Neutralized</p>
          <h3 className={`text-4xl font-black ${totalIssues > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalIssues}</h3>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-2">Pro Engine Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-black text-emerald-500 uppercase">Active</h3>
          </div>
        </div>
        <div className="flex flex-col space-y-3">
          <button onClick={downloadAllAsZip} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center space-x-2">
            {isZipping ? 'ZIPPING...' : 'DOWNLOAD ALL (ZIP)'}
          </button>
          <button onClick={onReset} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs">
            NEW SCAN
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="flex justify-between items-end px-2">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Target Manifest</h4>
          </div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(res)}
                className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedFile?.fileName === res.fileName 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                {res.mode === ScanMode.SUPER_PRO && <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/10 rounded-bl-full flex items-center justify-center"><span className="text-[8px] font-black text-yellow-500 -rotate-45">PRO</span></div>}
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[11px] font-bold text-slate-200 truncate pr-2">{res.fileName.split('/').pop()}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${res.isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {res.isSafe ? 'Secure' : `${res.issues.length} Hazards`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-grow h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${res.score > 80 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${res.score}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{res.score}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/3">
          {selectedFile ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">{selectedFile.fileName.split('/').pop()}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Mode:</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${selectedFile.mode === ScanMode.SUPER_PRO ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{selectedFile.mode}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/10"
                >
                  Export Neutralized
                </button>
              </div>

              {selectedFile.aiExplanation && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                   <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    Neural Forensic Summary
                   </h4>
                   <p className="text-slate-300 text-sm leading-relaxed italic font-medium">{selectedFile.aiExplanation}</p>
                </div>
              )}

              <div className="space-y-4">
                {selectedFile.issues.length > 0 ? selectedFile.issues.map((issue) => (
                  <div key={issue.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-colors">
                    <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${issue.threatLevel === ThreatLevel.CRITICAL ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                          {issue.threatLevel}
                        </span>
                        <span className="text-xs font-black text-white tracking-widest uppercase">{issue.type}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-600">OFFSET: {issue.line}</span>
                    </div>
                    <div className="p-6">
                      <p className="text-slate-400 text-sm mb-4">{issue.description}</p>
                      <div className="bg-black p-4 rounded-xl border border-slate-800 mb-4 font-mono text-[11px] overflow-x-auto">
                        <code className="text-red-400/90 whitespace-pre-wrap">{issue.codeSnippet}</code>
                      </div>
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{issue.suggestion}</div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Zero Threats Detected</h3>
                    <p className="text-slate-500 text-sm mt-2">Script integrity verified at {selectedFile.mode} level.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-600 py-20 uppercase tracking-[0.3em] font-black text-xs">
              <div className="w-12 h-12 border-2 border-slate-800 border-t-slate-500 rounded-full animate-spin mb-6"></div>
              Awaiting Target Selection
            </div>
          )}
        </div>
      </div>

      {/* Export Modal (Simplified for display) */}
      {isExportModalOpen && selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsExportModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-10">
               <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Export Shielded Output</h3>
               <p className="text-slate-500 text-sm mb-8 font-mono">NEUTRALIZING CRITICAL PAYLOADS WHILE PRESERVING LOGIC...</p>
               <div className="bg-black border border-slate-800 rounded-2xl mb-8 max-h-[400px] overflow-y-auto p-6 font-mono text-[10px] text-emerald-400/80 leading-relaxed">
                 {selectedFile.cleanedContent}
               </div>
               <div className="flex space-x-4">
                 <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-white font-black rounded-xl uppercase text-xs">Close</button>
                 <button onClick={() => {
                   const blob = new Blob([selectedFile.cleanedContent], { type: 'text/plain' });
                   const link = document.createElement('a');
                   link.href = URL.createObjectURL(blob);
                   link.download = `CLEANED_${selectedFile.fileName.split('/').pop()}`;
                   link.click();
                   setIsExportModalOpen(false);
                 }} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-xl uppercase text-xs shadow-xl shadow-emerald-900/20">Confirm & Download</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
