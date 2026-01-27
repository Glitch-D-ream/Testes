import React from 'react';
import { ShieldCheck, AlertTriangle, Search, CheckCircle } from 'lucide-react';

interface IntelligencePanelProps {
  consensusMetrics?: {
    sourceCount: number;
    verifiedCount: number;
  };
  absenceReport?: {
    summary: string;
    viabilityScore: number;
    checks: Array<{
      factor: string;
      status: 'present' | 'absent' | 'unknown';
      description: string;
      criticality: 'low' | 'medium' | 'high';
    }>;
  };
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ consensusMetrics, absenceReport }) => {
  if (!consensusMetrics && !absenceReport) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Painel de Consenso */}
      {consensusMetrics && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Validação por Consenso</h3>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{consensusMetrics.verifiedCount}</p>
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Fontes Convergentes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">Total de {consensusMetrics.sourceCount} fontes</p>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(consensusMetrics.verifiedCount / consensusMetrics.sourceCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Ausência */}
      {absenceReport && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Viabilidade Negativa</h3>
          </div>
          <div className="space-y-3">
            {absenceReport.checks.slice(0, 2).map((check, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {check.status === 'absent' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{check.factor}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{check.description}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
              {absenceReport.summary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
