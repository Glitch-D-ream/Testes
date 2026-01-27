
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Share2, Image as ImageIcon, ArrowLeft, Shield, Activity, Zap, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ForensicResultCard } from '../components/ForensicResultCard';
import { IntelligencePanel } from '../components/IntelligencePanel';
import { ForensicVulnerabilityPanel } from '../components/ForensicVulnerabilityPanel';
import { BenchmarkingPanel } from '../components/BenchmarkingPanel';
import { useAnalysis } from '../hooks/useAnalysis';
import { motion } from 'framer-motion';

export function AnalysisResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading, error, data, getById } = useAnalysis();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getById(id);
    }
  }, [id, getById]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Recuperando Dossiê...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass p-10 rounded-[2.5rem] border-rose-500/20 max-w-md text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Info size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Falha no Sistema</h2>
          <p className="text-slate-400 font-medium mb-8">{error?.message || 'Dossiê não localizado em nossa rede de agentes.'}</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:border-blue-500 transition-all">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-24 selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} /> Nova Auditoria
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-500" size={16} />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">Relatório Forense</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-16">
        {/* Card Principal de Resultado */}
        <ForensicResultCard 
          politicianName={data.author || 'Alvo'}
          score={data.probabilityScore || 0}
          verdict={data.data_sources?.budgetVerdict || 'Consistência em análise.'}
          analysisDate={new Date().toLocaleDateString('pt-BR')}
          confidence={85}
          category="Auditoria Forense"
          data={data}
        />

        {/* Grid de Inteligência */}
        <div className="space-y-8">
          <IntelligencePanel 
            consensusMetrics={data.data_sources?.consensusMetrics}
            absenceReport={data.data_sources?.absenceReport}
          />

          {data.data_sources?.vulnerabilityReport && (
            <ForensicVulnerabilityPanel report={data.data_sources.vulnerabilityReport} />
          )}

          {data.data_sources?.benchmarkResult && (
            <BenchmarkingPanel benchmark={data.data_sources.benchmarkResult} />
          )}

          {/* Rastreabilidade Financeira */}
          {(data.data_sources?.projects?.length > 0 || data.data_sources?.budgetVerdict) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[2.5rem] border border-slate-800/50 overflow-hidden"
            >
              <div className="bg-slate-900/50 px-10 py-6 border-b border-slate-800/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">📊 Rastreabilidade e Atos Oficiais</h3>
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">
                  SICONFI / CÂMARA
                </span>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Veredito Orçamentário</h4>
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50">
                    <p className="text-lg font-black text-blue-400 mb-2 uppercase tracking-tight">
                      {data.data_sources.budgetVerdict || 'Em Análise'}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {data.data_sources.budgetSummary || 'Dados insuficientes para veredito fiscal completo.'}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atuação Recente</h4>
                  <div className="space-y-3">
                    {data.data_sources.projects?.slice(0, 3).map((p: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                        <p className="text-xs font-bold text-slate-200 line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">{p.ementa}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase">{p.siglaTipo} {p.id}</span>
                          <Zap size={12} className="text-blue-500" />
                        </div>
                      </div>
                    )) || <p className="text-xs text-slate-500 italic">Nenhum projeto mapeado nesta região.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Relatório Escrito */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-10 border border-slate-800/50"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Relatório de Inteligência</h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20">
                <Activity size={14} className="animate-pulse" /> Auditoria Forense Ativa
              </div>
            </div>
            <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed bg-slate-900/20 p-8 rounded-3xl border border-slate-800/50">
              <ReactMarkdown>{data.text}</ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
