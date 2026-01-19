
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transform hover:rotate-12 transition-transform">
            <svg className="w-7 h-7 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">Guardian<span className="text-emerald-500">PRO</span></h1>
            <p className="text-[9px] text-slate-500 font-black tracking-[0.4em] leading-none mt-1 uppercase">Cyber Forensic Unit</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-10">
          <a href="#" className="text-[11px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Scanner</a>
          <a href="#" className="text-[11px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Database</a>
          <div className="h-4 w-[1px] bg-slate-800"></div>
          <button className="px-6 py-2.5 bg-white text-slate-950 text-[10px] font-black rounded-full transition-all hover:bg-emerald-400 uppercase tracking-[0.2em] shadow-xl shadow-white/5">
            PRO ACCESS
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
