
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, ShieldCheck, Database, Cpu, Search, Activity, BarChart3, Terminal } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { Button } from '../components/Button';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Home() {
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid selection:bg-emerald-500 selection:text-black">
      {/* Navigation - Minimalist Cyber */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-emerald-500 rounded-sm flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
                <ShieldCheck className="text-black" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter leading-none">SETH VII</span>
                <span className="text-[8px] font-bold tracking-[0.2em] text-emerald-500 uppercase">Cyber Intelligence</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                <a href="/dashboard" className="hover:text-emerald-500 transition-colors">Global Index</a>
                <a href="/methodology" className="hover:text-emerald-500 transition-colors">Protocol</a>
                <a href="/about" className="hover:text-emerald-500 transition-colors">Terminal</a>
              </div>
              <button 
                onClick={toggle}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - High Impact */}
      <main className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Audit System v2.0</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8">
              AUDITE A <span className="text-emerald-500">VERDADE</span> POLÍTICA.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground font-medium mb-12 max-w-xl leading-relaxed">
              O Seth VII cruza discursos brutos com execução orçamentária real para expor inconsistências com precisão forense.
            </p>

            <div className="max-w-2xl bg-card border border-border p-2 rounded-xl shadow-2xl">
              <SearchBar />
            </div>

            <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>Popular:</span>
              <button onClick={() => navigate('/analyze/nikolas')} className="hover:text-emerald-500 underline decoration-emerald-500/30">Nikolas Ferreira</button>
              <button onClick={() => navigate('/analyze/lula')} className="hover:text-emerald-500 underline decoration-emerald-500/30">Lula</button>
              <button onClick={() => navigate('/analyze/lira')} className="hover:text-emerald-500 underline decoration-emerald-500/30">Arthur Lira</button>
            </div>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px]" />
        </div>
      </main>

      {/* Stats/Features - Grid Terminal Style */}
      <section className="py-24 border-t border-border bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <div className="p-8 border border-border bg-card/50 hover:bg-emerald-500/[0.02] transition-colors group">
              <Terminal className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-black mb-4">EXTRAÇÃO FORENSE</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nossa IA não resume; ela extrai citações diretas e as anexa a fatos oficiais irrefutáveis.
              </p>
            </div>
            
            <div className="p-8 border border-border bg-card/50 hover:bg-emerald-500/[0.02] transition-colors group">
              <Database className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-black mb-4">NÚCLEO DE DADOS</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conexão direta com SICONFI, Portal da Transparência e API da Câmara para validação fiscal em tempo real.
              </p>
            </div>
            
            <div className="p-8 border border-border bg-card/50 hover:bg-emerald-500/[0.02] transition-colors group">
              <BarChart3 className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="text-xl font-black mb-4">BENCHMARKING</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compare a produtividade e a fidelidade de qualquer político com a média real de seu grupo ideológico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-tighter">SETH VII</span>
            <span className="text-[10px] text-muted-foreground">© 2026 AUDIT PROTOCOL</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">API</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
