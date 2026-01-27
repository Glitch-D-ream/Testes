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
import { ForensicTextReport } from './ForensicTextReport';

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
    <div className="w-full space-y-12">
      {/* Cyber Header Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        <div className="p-6 bg-card border border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Credibility Index</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tighter text-emerald-500">{analysisData.viabilityScore}%</span>
          </div>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Audit Confidence</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tighter">{analysisData.confidenceLevel}%</span>
          </div>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Sources Verified</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tighter">{analysisData.sourcesAnalyzed}</span>
          </div>
        </div>
        <div className="p-6 bg-card border border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Last Sync</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black tracking-tighter uppercase">{analysisData.lastUpdated}</span>
          </div>
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


            {/* Novo Relatório de Texto Forense */}
            <ForensicTextReport 
              verdict={{
                summary: analysisData?.verdict?.summary || "Análise concluída com base nos dados orçamentários e discursivos disponíveis.",
                score: analysisData?.viabilityScore || 0,
                level: (analysisData?.viabilityScore || 0) < 40 ? 'CRÍTICO' : (analysisData?.viabilityScore || 0) < 70 ? 'ALERTA' : 'ESTÁVEL'
              }}
              keyFindings={analysisData?.promises?.map((p: any) => ({
                title: p.category,
                content: p.reasoning,
                isContradiction: p.confidence < 0.5
              })) || []}
              technicalAnalysis={analysisData?.fullReport || "Processando relatório detalhado..."}
            />

            {analysisData?.contradictions && (
              <ForensicDossier contradictions={analysisData.contradictions} />
            )}

            {analysisData?.benchmarkResult && (
              <BenchmarkingPanel benchmark={analysisData.benchmarkResult} />
            )}

            {analysisData?.financeEvidences && (
              <FinancePanel evidences={analysisData.financeEvidences} />
            )}


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
