import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  BarChart, 
  Calendar,
  User as UserIcon,
  Tag as TagIcon,
  Image as ImageIcon,
  ShieldCheck,
  ZapOff
} from 'lucide-react';
import { ViabilityThermometer } from '../components/ViabilityThermometer';
import { PromiseCard } from '../components/PromiseCard';
import { Button } from '../components/Button';
import BudgetChart from '../components/BudgetChart';
import { useAnalysis } from '../hooks/useAnalysis';
import { toast } from 'sonner';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, loading, error, data } = useAnalysis();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getById(id).catch(() => {
        toast.error('Não foi possível carregar a análise.');
      });
    }
  }, [id, getById]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/analyze/${id}/pdf`);
      if (!response.ok) throw new Error('Erro ao baixar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analise-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error('Erro ao baixar o relatório PDF');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 font-medium">Validando dados oficiais e auditoria...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-bold">Análise não encontrada</h1>
          <p className="text-slate-500">O relatório solicitado não existe ou o político não foi identificado com clareza.</p>
          <Button onClick={() => navigate('/')} fullWidth>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const results = data.results || {};
  const isOfficialOnly = results.status === 'official_profile_only';
  const promises = data.promises || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Share2 size={16} />} 
              onClick={handleShare}
            >
              {copied ? 'Copiado' : 'Compartilhar'}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Download size={16} />}
              onClick={handleDownloadPDF}
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        {/* Status Banner */}
        {isOfficialOnly && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl">
              <ZapOff size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-200">Análise de IA Indisponível</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">Exibindo apenas o <strong>Perfil Oficial</strong> baseado em dados governamentais crus. Nenhuma evidência textual válida foi encontrada para análise profunda.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header Section */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} /> Perfil Validado
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> {new Date(data.createdAt || '').toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-6 leading-tight">
                {data.politician_name || data.author}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-slate-500 mb-8 border-y border-slate-100 dark:border-slate-800 py-4">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-blue-500" />
                  <span className="font-medium">{results.politician?.role || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TagIcon size={16} className="text-blue-500" />
                  <span className="font-medium">{results.politician?.party || 'N/A'} - {results.politician?.state || 'N/A'}</span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Info size={20} className="text-blue-600" /> Parecer Técnico
                </h3>
                <div className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border-l-4 border-blue-600 whitespace-pre-wrap">
                  {data.text || "Nenhuma análise textual disponível."}
                </div>
              </div>
            </section>

            {/* Budget Analysis Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <BarChart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Execução Orçamentária: {results.mainCategory || 'Geral'}</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Fonte: SICONFI / Tesouro Nacional</p>
                </div>
              </div>
              
              <BudgetChart 
                totalBudget={results.budgetViability?.totalBudget || 0} 
                executedBudget={results.budgetViability?.executedBudget || 0} 
                executionRate={results.budgetViability?.executionRate || 0} 
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
              />
              <p className="mt-4 text-xs text-slate-400 italic">
                * Dados referentes ao último exercício fiscal disponível. A taxa de execução reflete o quanto do orçamento empenhado foi efetivamente liquidado.
              </p>
            </section>

            {/* Promises List */}
            {!isOfficialOnly && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                    <CheckCircle2 size={28} className="text-emerald-500" /> 
                    Promessas Auditadas
                  </h2>
                </div>
                
                {promises.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {promises.map((promise: any, index: number) => (
                      <PromiseCard 
                        key={index} 
                        id={promise.id}
                        text={promise.promise_text || promise.text}
                        category={promise.category || 'Geral'}
                        confidence={promise.confidence_score || promise.confidence || 0}
                        reasoning={promise.reasoning}
                        evidenceSnippet={promise.evidence_snippet}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhuma promessa explícita detectada</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              <ViabilityThermometer score={(data.probabilityScore || 0) / 100} />
              
              <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Confiança dos Dados</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={14} />
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>Identificação:</strong> Político validado via Tabela Canônica (IDs Oficiais).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <BarChart size={14} />
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>Orçamento:</strong> Dados crus do SICONFI sem interferência de IA.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
