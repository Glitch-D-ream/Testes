
import React from 'react';
import { Shield, CheckCircle2, AlertCircle, Calendar, Info } from 'lucide-react';

interface ForensicResultCardProps {
  politicianName: string;
  score: number;
  verdict: string;
  analysisDate: string;
  confidence: number;
  category: string;
}

export const ForensicResultCard: React.FC<ForensicResultCardProps> = ({
  politicianName,
  score,
  verdict,
  analysisDate,
  confidence,
  category
}) => {
  const isLowScore = score < 50;
  const statusColor = isLowScore ? 'text-red-600' : 'text-emerald-600';
  const statusBg = isLowScore ? 'bg-red-50' : 'bg-emerald-50';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{category}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Calendar size={14} />
                <span>{analysisDate}</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {politicianName}
            </h2>
          </div>

          <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${statusBg}`}>
            {isLowScore ? <AlertCircle className="text-red-600" size={20} /> : <CheckCircle2 className="text-emerald-600" size={20} />}
            <span className={`font-bold text-sm ${statusColor}`}>
              {isLowScore ? 'Vulnerabilidade Identificada' : 'Consistência Verificada'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Índice de Credibilidade</p>
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className={`text-6xl font-black ${statusColor}`}>{score}%</span>
            </div>
          </div>

          <div className="md:col-span-2 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
              <Shield size={18} className="text-blue-600" />
              <h3 className="font-bold">Veredito do Seth VII</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {verdict}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confiança dos Dados</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${confidence}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{confidence}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Info size={14} />
            <span className="text-[10px] font-medium uppercase tracking-widest">Auditoria Realizada via Protocolo Seth-v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
