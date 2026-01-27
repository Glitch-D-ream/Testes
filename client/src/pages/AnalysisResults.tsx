import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Share2, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TopicCard from '../components/TopicCard';
import { ViabilityThermometer } from '../components/ViabilityThermometer';
import { IntelligencePanel } from '../components/IntelligencePanel';
import { ForensicVulnerabilityPanel } from '../components/ForensicVulnerabilityPanel';
import { BenchmarkingPanel } from '../components/BenchmarkingPanel';
import { useAnalysis } from '../hooks/useAnalysis';

export function AnalysisResults() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, data, getById } = useAnalysis();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getById(id);
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
      alert('Erro ao baixar o relatório PDF');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500">Análise não encontrada</p>
        </div>
      </div>
    );
  }

  const promises = data.promises || [];
  
  // Agrupar promessas por categoria
  const groupedPromises = promises.reduce((acc: Record<string, any[]>, promise: any) => {
    const cat = promise.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(promise);
    return acc;
  }, {});

  const averageConfidence = promises.length > 0
    ? (promises.reduce((sum: number, p: any) => sum + (p.confidence_score || p.confidence || 0), 0) / promises.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Auditoria Forense Seth VII</h1>
              <p className="text-gray-600">
                {data.author ? `Alvo: ${data.author}` : 'Análise de promessa política'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('A geração de relatórios PDF está em manutenção temporária. Por favor, visualize os dados diretamente na plataforma.')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-md cursor-not-allowed opacity-75"
                title="Funcionalidade em manutenção"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => alert('A geração de cards para redes sociais está em manutenção temporária. Por favor, visualize os dados diretamente na plataforma.')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-400 text-white rounded-md cursor-not-allowed opacity-75"
                title="Funcionalidade em manutenção"
              >
                <ImageIcon className="w-4 h-4" />
                Card
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">Promessas Identificadas</p>
                <p className="text-2xl font-bold text-blue-600">{promises.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">Confiança da IA</p>
                <p className="text-2xl font-bold text-green-600">{averageConfidence.toFixed(1)}%</p>
              </div>
            </div>
            <ViabilityThermometer 
              score={data.probabilityScore || 0} 
              details={data.probability_score_details}
            />
          </div>

          {/* Checkpoint 7: Painéis de Inteligência Avançada */}
          <div className="space-y-6">
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

            {/* Novo Painel: Rastreabilidade Financeira e Projetos */}
            {(data.data_sources?.projects?.length > 0 || data.data_sources?.budgetVerdict) && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">📊 Rastreabilidade e Atos Oficiais</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">SICONFI / CÂMARA</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Veredito Orçamentário</h4>
                    <div className={`p-4 rounded-lg border ${data.data_sources.budgetVerdict === 'Viável' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                      <p className={`text-sm font-bold ${data.data_sources.budgetVerdict === 'Viável' ? 'text-green-700' : 'text-amber-700'} mb-1`}>
                        {data.data_sources.budgetVerdict || 'Análise Indisponível'}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {data.data_sources.budgetSummary || 'Dados insuficientes para veredito fiscal.'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Projetos e Atuação Recente</h4>
                    <div className="space-y-2">
                      {data.data_sources.projects?.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="text-xs p-2 bg-slate-50 rounded border border-slate-100">
                          <p className="font-semibold text-slate-700 line-clamp-1">{p.ementa}</p>
                          <p className="text-slate-500 mt-1">ID: {p.id} | {p.siglaTipo}</p>
                        </div>
                      )) || <p className="text-xs text-slate-400 italic">Nenhum projeto recente mapeado.</p>}
                    </div>
                  </div>
                </div>
                {data.data_sources.contrastAnalysis && (
                  <div className="px-6 pb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Análise de Contraste (Discurso vs. Ação)</h4>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <p className="text-xs text-indigo-800 leading-relaxed italic">
                        "{data.data_sources.contrastAnalysis}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Texto Original */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Relatório de Inteligência</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                Auditado via SICONFI/TSE
              </span>
            </div>
            <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100 mb-6">
              <ReactMarkdown>{data.text}</ReactMarkdown>
            </div>

            {/* Detalhes Técnicos do Score */}
            {data.probability_score_details && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Decomposição Técnica do Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-blue-600 font-medium uppercase">Orçamento</p>
                    <p className="text-lg font-bold text-blue-900">{(data.probability_score_details.budgetImpact * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-blue-600 font-medium uppercase">Histórico</p>
                    <p className="text-lg font-bold text-blue-900">{(data.probability_score_details.legislativeHistory * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-blue-600 font-medium uppercase">Confiança IA</p>
                    <p className="text-lg font-bold text-blue-900">{(data.probability_score_details.aiConfidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-red-600 font-medium uppercase">Penalidade</p>
                    <p className="text-lg font-bold text-red-700">-{((data.probability_score_details.incoherencePenalty || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dossiê por Tópicos */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dossiê por Assuntos</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
              {promises.length} Descobertas
            </span>
          </div>

          {promises.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(groupedPromises).map(([category, categoryPromises]) => (
                <TopicCard
                  key={category}
                  category={category}
                  promises={categoryPromises}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <p className="text-slate-500">Nenhuma promessa identificada neste dossiê.</p>
            </div>
          )}
        </div>

        {/* Metodologia */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Sobre Esta Análise</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            Esta análise utiliza Processamento de Linguagem Natural avançado e Inteligência Artificial para
            identificar promessas políticas, avaliar sua viabilidade baseada em dados orçamentários públicos
            (SICONFI, Portal da Transparência) e histórico político (TSE). O resultado é uma probabilidade
            estimada de cumprimento, não uma acusação ou julgamento de caráter.
          </p>
        </div>
      </div>
    </div>
  );
}
