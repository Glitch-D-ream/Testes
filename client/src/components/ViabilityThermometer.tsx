import React from 'react';
import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';

interface ViabilityThermometerProps {
  score: number;
}

export function ViabilityThermometer({ score }: ViabilityThermometerProps) {
  const percentage = Math.round(score * 100);
  
  const getStatus = (s: number) => {
    if (s >= 0.8) return { 
      label: 'Altamente Viável', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500', 
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/10',
      icon: <ShieldCheck className="text-emerald-500" size={24} />,
      desc: 'Esta promessa tem forte base orçamentária e histórico político favorável.'
    };
    if (s >= 0.6) return { 
      label: 'Viável', 
      color: 'text-blue-500', 
      bg: 'bg-blue-500', 
      lightBg: 'bg-blue-50 dark:bg-blue-900/10',
      icon: <ShieldCheck className="text-blue-500" size={24} />,
      desc: 'Existem recursos e condições para que esta promessa seja cumprida.'
    };
    if (s >= 0.4) return { 
      label: 'Moderada', 
      color: 'text-amber-500', 
      bg: 'bg-amber-500', 
      lightBg: 'bg-amber-50 dark:bg-amber-900/10',
      icon: <Info className="text-amber-500" size={24} />,
      desc: 'A viabilidade depende de fatores externos ou mudanças orçamentárias.'
    };
    return { 
      label: 'Baixa Viabilidade', 
      color: 'text-rose-500', 
      bg: 'bg-rose-500', 
      lightBg: 'bg-rose-50 dark:bg-rose-900/10',
      icon: <ShieldAlert className="text-rose-500" size={24} />,
      desc: 'Histórico de votação contrário ou falta de recursos orçamentários reais.'
    };
  };

  const status = getStatus(score);

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Score de Viabilidade</h4>
              <p className={`text-2xl font-black ${status.color}`}>{status.label}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
              {percentage}<span className="text-xl text-slate-400">%</span>
            </span>
          </div>
        </div>
        
        <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${status.bg} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {status.desc}
        </p>
      </div>
      
      <div className={`px-6 py-3 border-t border-slate-100 dark:border-slate-800 ${status.lightBg}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
          Baseado em Dados Reais do SICONFI e TSE
        </p>
      </div>
    </div>
  );
}
