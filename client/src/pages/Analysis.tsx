import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Loader } from 'lucide-react';
import { Button } from '../components/Button';
import AuditDashboard from '../components/AuditDashboard';

export default function AnalysisNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analyze/${id}`);
        if (response.ok) {
          const data = await response.json();
          setAnalysisData({
            politicianName: data.author || 'Político Auditado',
            viabilityScore: data.probabilityScore || 0,
            confidenceLevel: 90,
            sourcesAnalyzed: data.evidences?.length || 0,
            lastUpdated: new Date(data.created_at).toLocaleDateString('pt-BR'),
            promises: data.promises || [],
            vulnerabilityReport: data.data_sources?.vulnerabilityReport,
            benchmarkResult: data.data_sources?.benchmarkResult,
            consensusMetrics: data.data_sources?.consensusMetrics,
            absenceReport: data.data_sources?.absenceReport
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
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
