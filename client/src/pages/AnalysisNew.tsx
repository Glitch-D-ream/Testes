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
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setAnalysisData({
        politicianName: 'Jones Manoel',
        viabilityScore: 42,
        confidenceLevel: 88,
        sourcesAnalyzed: 47,
        lastUpdated: '27 de janeiro, 14:32',
        promises: [
          {
            id: '1',
            title: 'Reforma Urbana Radical com Combate à Especulação Imobiliária',
            category: 'Urbanismo',
            viability: 35,
            status: 'completed',
          },
          {
            id: '2',
            title: 'Reestatização de Setores Estratégicos (Energia e Combustíveis)',
            category: 'Economia',
            viability: 28,
            status: 'completed',
          },
          {
            id: '3',
            title: 'Expansão do Ensino Público de Qualidade',
            category: 'Educação',
            viability: 55,
            status: 'in_progress',
          },
          {
            id: '4',
            title: 'Valorização da Produção Cultural Periférica',
            category: 'Cultura',
            viability: 62,
            status: 'pending',
          },
        ],
        influenceNodes: [
          {
            id: 'jones',
            label: 'Jones Manoel',
            type: 'politician',
            size: 15,
            color: '#3b82f6',
          },
          {
            id: 'empresa1',
            label: 'Petrobras',
            type: 'company',
            size: 10,
            color: '#ef4444',
          },
          {
            id: 'empresa2',
            label: 'Caixa Econômica',
            type: 'company',
            size: 10,
            color: '#ef4444',
          },
          {
            id: 'doador1',
            label: 'Sindicato dos Metalúrgicos',
            type: 'donor',
            size: 8,
            color: '#f59e0b',
          },
          {
            id: 'politico1',
            label: 'Boulos',
            type: 'politician',
            size: 8,
            color: '#8b5cf6',
          },
        ],
        influenceEdges: [
          {
            source: 'jones',
            target: 'empresa1',
            weight: 2,
            type: 'political',
          },
          {
            source: 'jones',
            target: 'empresa2',
            weight: 1.5,
            type: 'financial',
          },
          {
            source: 'jones',
            target: 'doador1',
            weight: 2.5,
            type: 'financial',
          },
          {
            source: 'jones',
            target: 'politico1',
            weight: 1,
            type: 'political',
          },
        ],
        viabilityDimensions: [
          {
            name: 'Orçamentário',
            value: 35,
            description: 'Disponibilidade de recursos públicos',
          },
          {
            name: 'Político',
            value: 42,
            description: 'Apoio legislativo necessário',
          },
          {
            name: 'Jurídico',
            value: 48,
            description: 'Conformidade constitucional',
          },
          {
            name: 'Técnico',
            value: 55,
            description: 'Viabilidade operacional',
          },
          {
            name: 'Social',
            value: 62,
            description: 'Aceitação pública',
          },
        ],
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
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
