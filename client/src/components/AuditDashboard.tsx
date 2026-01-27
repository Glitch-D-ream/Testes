import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Zap,
} from 'lucide-react';
import InfluenceGraph from './InfluenceGraph';
import ViabilityRadar from './ViabilityRadar';
import { ForensicVulnerabilityPanel } from './ForensicVulnerabilityPanel';
import { BenchmarkingPanel } from './BenchmarkingPanel';
import { IntelligencePanel } from './IntelligencePanel';
import { RiskPanel } from './RiskPanel';
import { FinancePanel } from './FinancePanel';
import { ForensicDossier } from './ForensicDossier';

interface AuditDashboardProps {
  politicianName: string;
  analysisData: {
    viabilityScore: number;
    confidenceLevel: number;
    sourcesAnalyzed: number;
    lastUpdated: string;
    promises: Array<{
      id: string;
      title: string;
      category: string;
      viability: number;
      status: 'pending' | 'in_progress' | 'completed';
    }>;
    influenceNodes: Array<{
      id: string;
      label: string;
      type: 'politician' | 'company' | 'donor' | 'entity';
      size: number;
      color: string;
    }>;
    influenceEdges: Array<{
      source: string;
      target: string;
      weight: number;
      type: 'financial' | 'political' | 'legal';
    }>;
    viabilityDimensions: Array<{
      name: string;
      value: number;
      description: string;
    }>;
    vulnerabilityReport?: any;
    benchmarkResult?: any;
    consensusMetrics?: any;
    absenceReport?: any;
  };
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  politicianName,
  analysisData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'radar'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header com Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score de Viabilidade */}
        <div className={`p-6 rounded-xl border border-slate-200 dark:border-slate-700 ${getScoreColor(analysisData.viabilityScore)}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Viabilidade</h4>
            <TrendingUp size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{analysisData.viabilityScore}</span>
            <span className="text-sm opacity-75">%</span>
          </div>
          <div className="mt-3 w-full bg-black/10 rounded-full h-2">
            <div
              className={`${getScoreBgColor(analysisData.viabilityScore)} h-2 rounded-full transition-all`}
              style={{ width: `${analysisData.viabilityScore}%` }}
            />
          </div>
        </div>

        {/* Nível de Confiança */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Confiança</h4>
            <Shield size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{analysisData.confidenceLevel}</span>
            <span className="text-sm opacity-75">%</span>
          </div>
          <p className="text-xs mt-3 opacity-75">Baseado em {analysisData.sourcesAnalyzed} fontes</p>
        </div>

        {/* Fontes Analisadas */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20 text-purple-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Fontes</h4>
            <FileText size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{analysisData.sourcesAnalyzed}</span>
            <span className="text-sm opacity-75">documentos</span>
          </div>
          <p className="text-xs mt-3 opacity-75">Últimas 24 horas</p>
        </div>

        {/* Última Atualização */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 text-slate-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Atualizado</h4>
            <Clock size={18} />
          </div>
          <p className="text-sm font-mono">{analysisData.lastUpdated}</p>
          <p className="text-xs mt-3 opacity-75">Análise em tempo real</p>
        </div>
      </div>

      {/* Abas de Visualização */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} />
            Visão Geral
          </div>
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'graph'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Influências
          </div>
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'radar'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Análise Multidimensional
          </div>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Painéis de Inteligência Seth VII */}
            <IntelligencePanel 
              consensusMetrics={analysisData?.consensusMetrics}
              absenceReport={analysisData?.absenceReport}
            />

            {analysisData?.vulnerabilityReport && (
              <ForensicVulnerabilityPanel report={analysisData.vulnerabilityReport} />
            )}

            {analysisData?.benchmarkResult && (
              <BenchmarkingPanel benchmark={analysisData.benchmarkResult} />
            )}

            {analysisData?.financeEvidences && (
              <FinancePanel evidences={analysisData.financeEvidences} />
            )}

            {analysisData?.contradictions && (
              <ForensicDossier contradictions={analysisData.contradictions} />
            )}

            <RiskPanel risks={analysisData?.promises?.flatMap((p: any) => p.risks || [])} />

            {/* Promessas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Promessas Identificadas
                </h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {analysisData.promises.map((promise) => (
                  <div
                    key={promise.id}
                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {promise.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {promise.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Viabilidade: {promise.viability}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {promise.status === 'completed' && (
                          <CheckCircle className="text-green-600" size={20} />
                        )}
                        {promise.status === 'in_progress' && (
                          <Clock className="text-yellow-600 animate-spin" size={20} />
                        )}
                        {promise.status === 'pending' && (
                          <AlertTriangle className="text-slate-400" size={20} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="h-96">
            <InfluenceGraph
              nodes={analysisData.influenceNodes}
              edges={analysisData.influenceEdges}
              politicianName={politicianName}
            />
          </div>
        )}

        {activeTab === 'radar' && (
          <div className="h-96">
            <ViabilityRadar
              dimensions={analysisData.viabilityDimensions}
              overallScore={analysisData.viabilityScore}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditDashboard;
