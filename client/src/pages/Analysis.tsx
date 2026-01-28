import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Loader } from 'lucide-react';
import { Button } from '../components/Button';
import AuditDashboard from '../components/AuditDashboard';
import { ForensicResultCard } from '../components/ForensicResultCard';

export default function AnalysisNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;
      try {
        const response = await fetch(`/api/analyze/${id}`);
        if (response.ok) {
          const data = await response.json();
          setAnalysisData({
            politicianName: data.author || 'Político Auditado',
            viabilityScore: data.probability_score || 0,
            confidenceLevel: data.data_sources?.consensusMetrics?.sourceCount ? 95 : 70,
            sourcesAnalyzed: data.data_sources?.consensusMetrics?.sourceCount || 0,
            lastUpdated: new Date(data.created_at).toLocaleDateString('pt-BR'),
            promises: data.extracted_promises || [],
            fullReport: data.text || "Relatório em processamento...",
            verdict: {
              summary: data.data_sources?.budgetSummary || "Análise baseada em dados oficiais e discursos minerados.",
            },
            vulnerabilityReport: data.data_sources?.vulnerabilityReport,
            benchmarkResult: data.data_sources?.benchmarkResult,
            consensusMetrics: data.data_sources?.consensusMetrics,
            absenceReport: data.data_sources?.absenceReport,
            financeEvidences: data.data_sources?.financeEvidences,
            contradictions: data.data_sources?.contradictions || data.data_sources?.vulnerabilityReport?.vulnerabilities?.map((v: any) => ({
              type: v.type,
              description: v.description,
              severity: v.severity,
              evidence: v.evidence
            }))
          });
        }
      } catch (err) {
        console.error('Erro ao carregar análise:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Analisando dados...
          </p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-red-500/50 p-8 rounded-lg max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Falha na Auditoria</h2>
          <p className="text-slate-400 mb-6">
            Não foi possível carregar os dados desta análise. O dossiê pode estar corrompido ou ainda em processamento.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Voltar para o Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header com Glassmorphism */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Voltar</span>
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {analysisData?.politicianName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Análise Completa de Viabilidade
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Download size={18} />}
                className="hidden sm:flex"
              >
                Exportar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Share2 size={18} />}
                className="hidden sm:flex"
              >
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Novo Card de Impacto Forense */}
        <ForensicResultCard 
          politicianName={analysisData?.politicianName}
          score={analysisData?.viabilityScore || 0}
          verdict={analysisData?.verdict?.summary || "Processando veredito final..."}
          analysisDate={analysisData?.lastUpdated}
          confidence={analysisData?.confidenceLevel || 90}
          category={analysisData?.category || "GERAL"}
        />

        <div className="bg-white dark:bg-black rounded-sm shadow-2xl border border-border overflow-hidden">
          <div className="p-8">
            <AuditDashboard
              politicianName={analysisData?.politicianName}
              analysisData={analysisData}
            />
          </div>
        </div>

        {/* Footer com Informações Legais */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Esta análise foi gerada automaticamente usando dados públicos do SICONFI, TSE e Portal da Transparência.
          </p>
          <p className="mt-2">
            Última atualização: {analysisData?.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
