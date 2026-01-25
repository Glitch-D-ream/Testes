import React from 'react';
import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';

interface ViabilityThermometerProps {
  score: number;
  details?: {
    budgetImpact: number;
    legislativeHistory: number;
    aiConfidence: number;
    incoherencePenalty?: number;
  };
}

export function ViabilityThermometer({ score, details }: ViabilityThermometerProps) {
  const percentage = Math.round(score * 100);
  
  const getStatus = (s: number) => {
    if (s >= 0.8) return { 
      label: 'Altamente Viável', 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-500', 
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/10',
      icon: <ShieldCheck className="text-emerald-500" size={28} />,
      desc: 'Esta promessa tem forte base orçamentária e histórico político favorável.'
    };
    if (s >= 0.6) return { 
      label: 'Viável', 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-500', 
      lightBg: 'bg-blue-50 dark:bg-blue-900/10',
      icon: <ShieldCheck className="text-blue-500" size={28} />,
      desc: 'Existem recursos e condições para que esta promessa seja cumprida.'
    };
    if (s >= 0.4) return { 
      label: 'Moderada', 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-500', 
      lightBg: 'bg-amber-50 dark:bg-amber-900/10',
      icon: <Info className="text-amber-500" size={28} />,
      desc: 'A viabilidade depende de fatores externos ou mudanças orçamentárias.'
    };
    return { 
      label: 'Baixa Viabilidade', 
      color: 'text-rose-600 dark:text-rose-400', 
      bg: 'bg-rose-500', 
      lightBg: 'bg-rose-50 dark:bg-rose-900/10',
      icon: <ShieldAlert className="text-rose-500" size={28} />,
      desc: 'Histórico de votação contrário ou falta de recursos orçamentários reais.'
    };
  };

  const status = getStatus(score);

  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl`}>
      <div className="p-8 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${status.lightBg}`}>
              {status.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Veredito de Viabilidade</h4>
              <p className={`text-3xl font-black tracking-tight ${status.color}`}>{status.label}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
              {percentage}<span className="text-2xl text-slate-400">%</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Probabilidade Real</span>
          </div>
        </div>
        
        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
          <div 
            className={`h-full ${status.bg} rounded-full transition-all duration-1000 ease-out shadow-lg`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className={`p-4 rounded-2xl ${status.lightBg} border border-current border-opacity-10`}>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
            {status.desc}
          </p>
        </div>

        {details && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Orçamento</p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(details.budgetImpact * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${details.budgetImpact * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Legislativo</p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(details.legislativeHistory * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${details.legislativeHistory * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Confiança IA</p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{(details.aiConfidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${details.aiConfidence * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className={`px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-center gap-2`}>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Auditoria em Tempo Real: SICONFI • TSE • CÂMARA • SENADO
        </p>
      </div>
    </div>
  );
}
