
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Database, BarChart3, ChevronRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-blue-100 selection:text-blue-900">
      {/* Header Simples */}
      <nav className="border-b border-slate-100 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={18} />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Seth VII</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-blue-600 transition-colors">Metodologia</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Transparência</a>
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                Acessar API
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Auditoria Política em Tempo Real</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
            A verdade por trás dos <br className="hidden md:block" /> 
            <span className="text-blue-600">discursos políticos.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            O Seth VII utiliza inteligência artificial para cruzar promessas e discursos com dados oficiais de execução orçamentária e legislativa.
          </p>

          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-blue-500/5">
            <SearchBar />
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500">
            <span>Buscas recentes:</span>
            <button onClick={() => navigate('/analyze/nikolas')} className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors">Nikolas Ferreira</button>
            <button onClick={() => navigate('/analyze/lira')} className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors">Arthur Lira</button>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Análise de Discurso</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Mineramos discursos brutos em redes sociais e notícias para extrair promessas literais e compromissos públicos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dados Oficiais</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Cruzamento automático com o Portal da Transparência, SICONFI e API da Câmara para validação de fatos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-blue-600">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Índice de Confiança</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada análise gera um score de credibilidade baseado na consistência entre o que é dito e o que é efetivamente feito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">Seth VII</span>
            <span className="text-slate-400 text-sm">© 2026 Auditoria Política</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
