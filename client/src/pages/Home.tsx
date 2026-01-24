import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Moon, Sun, ShieldCheck, Database, Cpu, Search, History, BarChart3, FileText } from 'lucide-react';
import AnalysisForm from '../components/AnalysisForm';
import { Button } from '../components/Button';
import { useTheme } from '../hooks/useTheme';

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (data: {
    text: string;
    author?: string;
    category?: string;
  }) => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar análise');
      }

      const result = await response.json();
      toast.success('Análise realizada com sucesso!');
      navigate(`/analysis/${result.id}`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar análise. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white" size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">Detector de Promessas</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="/search" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                <Search size={16} /> Buscar
              </a>
              <a href="/history" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                <History size={16} /> Histórico
              </a>
              <a href="/statistics" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                <BarChart3 size={16} /> Estatísticas
              </a>
              <a href="/methodology" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                <FileText size={16} /> Metodologia
              </a>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              Transparência Real na Política
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-10">
              Analise discursos e promessas eleitorais com cruzamento automático de dados reais do SICONFI, TSE e Portal da Transparência.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className={`rounded-2xl shadow-2xl overflow-hidden border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-500" />
              <div className="p-8">
                <AnalysisForm onSubmit={handleSubmit} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400 rounded-full blur-[120px]" />
        </div>
      </div>

      {/* Features Grid */}
      <section className={`py-24 border-t ${
        theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Cpu size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">IA Especializada</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Extração automática de promessas usando modelos de linguagem treinados em contextos políticos brasileiros.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Database size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Dados Governamentais</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Cruzamento direto com APIs oficiais do Tesouro Nacional e TSE para validar viabilidade orçamentária e histórica.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Auditabilidade</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Metodologia aberta e resultados fundamentados em evidências, permitindo que qualquer cidadão audite a análise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-400 rounded flex items-center justify-center">
                <ShieldCheck className="text-white" size={14} />
              </div>
              <span className="font-bold text-slate-500">Detector de Promessa Vazia</span>
            </div>
            
            <div className="flex gap-8 text-sm text-slate-500">
              <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacidade</a>
              <a href="/terms" className="hover:text-blue-600 transition-colors">Termos</a>
              <a href="/methodology" className="hover:text-blue-600 transition-colors">Metodologia</a>
            </div>
            
            <p className="text-sm text-slate-400">
              © 2026 — Dados extraídos de fontes públicas oficiais.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
