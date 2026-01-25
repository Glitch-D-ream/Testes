import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

interface IncoherenceCase {
  voteId: string;
  voteDate: string;
  voteType: string;
  propositionNumber: string;
  propositionEmenta: string;
  incoherenceType: 'DIRECT_CONTRADICTION' | 'THEMATIC_CONTRADICTION' | 'PARTIAL_CONTRADICTION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  legislativeSourceUrl?: string;
}

interface CoherenceAnalysisPanelProps {
  coherenceScore: number;
  incoherences: IncoherenceCase[];
  summary: string;
  promiseText: string;
  politicianName: string;
}

export function CoherenceAnalysisPanel({
  coherenceScore,
  incoherences,
  summary,
  promiseText,
  politicianName
}: CoherenceAnalysisPanelProps) {
  const [expandedIncoherence, setExpandedIncoherence] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30';
      case 'MEDIUM':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
      case 'LOW':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30';
      default:
        return 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800/30';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-red-700 dark:text-red-300';
      case 'MEDIUM':
        return 'text-amber-700 dark:text-amber-300';
      case 'LOW':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />;
      case 'MEDIUM':
        return <Zap size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'LOW':
        return <TrendingDown size={18} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <FileText size={18} className="text-slate-600 dark:text-slate-400" />;
    }
  };

  const getCoherenceStatus = () => {
    if (coherenceScore >= 80) return { label: 'Altamente Coerente', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10' };
    if (coherenceScore >= 50) return { label: 'Parcialmente Coerente', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/10' };
    return { label: 'Incoerente', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/10' };
  };

  const coherenceStatus = getCoherenceStatus();

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className={`rounded-2xl border-2 p-6 ${coherenceStatus.bgColor} border-current`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black uppercase tracking-tight">
            Análise de Coerência Legislativa
          </h3>
          <div className="flex items-center gap-2">
            <Scale size={24} className={coherenceStatus.color} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Score de Coerência
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${coherenceStatus.color}`}>
                {coherenceScore}%
              </span>
              <span className={`text-sm font-bold uppercase tracking-wider ${coherenceStatus.color}`}>
                {coherenceStatus.label}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Incoerências Detectadas
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                {incoherences.length}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">
                {incoherences.length === 1 ? 'caso' : 'casos'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                coherenceScore >= 80
                  ? 'bg-emerald-500'
                  : coherenceScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${coherenceScore}%` }}
            />
          </div>
        </div>

        {/* Summary Text */}
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
          {summary}
        </p>
      </div>

      {/* Incoherences List */}
      {incoherences.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Detalhes das Incoerências
          </h4>

          {incoherences.map((incoherence, index) => (
            <div
              key={incoherence.voteId}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(
                incoherence.severity
              )}`}
              onClick={() =>
                setExpandedIncoherence(
                  expandedIncoherence === incoherence.voteId ? null : incoherence.voteId
                )
              }
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(incoherence.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-wider ${getSeverityTextColor(incoherence.severity)}`}>
                        {incoherence.severity === 'HIGH'
                          ? 'Contradição Direta'
                          : incoherence.severity === 'MEDIUM'
                            ? 'Contradição Temática'
                            : 'Contradição Parcial'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded-full">
                        {incoherence.voteType}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {incoherence.propositionNumber}
                    </p>
                  </div>
                </div>

                <button className="flex-shrink-0 p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                  {expandedIncoherence === incoherence.voteId ? (
                    <ChevronUp size={20} className="text-slate-600 dark:text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedIncoherence === incoherence.voteId && (
                <div className="mt-4 pt-4 border-t border-current/20 space-y-4">
                  {/* Ementa */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Proposição
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {incoherence.propositionEmenta}
                    </p>
                  </div>

                  {/* Explanation */}
                  <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Análise da Incoerência
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {incoherence.explanation}
                    </p>
                  </div>

                  {/* Vote Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Data do Voto
                      </p>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Calendar size={14} />
                        <span>{new Date(incoherence.voteDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Tipo de Voto
                      </p>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <FileText size={14} />
                        <span>{incoherence.voteType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Link to Vote */}
                  {incoherence.legislativeSourceUrl && (
                    <a
                      href={incoherence.legislativeSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline mt-2"
                    >
                      Ver votação oficial na Câmara
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Incoherences */}
      {incoherences.length === 0 && (
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/10 p-6 text-center">
          <div className="flex justify-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
            Nenhuma incoerência legislativa detectada
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            O histórico de votações do político está alinhado com as promessas declaradas.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4">
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong>Como funciona:</strong> Este análise compara as promessas do político com seu histórico de votações na Câmara dos Deputados. Incoerências são detectadas quando há contradição entre o que foi prometido e como o político votou em proposições relacionadas.
        </p>
      </div>
    </div>
  );
}
