
import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, Lock, Search, FileText, AlertTriangle } from 'lucide-react';

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
  const statusColor = isLowScore ? 'text-red-500' : 'text-emerald-500';
  const statusBg = isLowScore ? 'bg-red-500/10' : 'bg-emerald-500/10';
  const statusBorder = isLowScore ? 'border-red-500/20' : 'border-emerald-500/20';

  return (
    <div className="relative group overflow-hidden bg-black border border-border rounded-sm p-1">
      {/* Decorative Cyber Elements */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-500/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-500/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-500/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-500/50" />

      <div className="bg-card p-6 border border-border/50 relative">
        {/* Header - Terminal Style */}
        <div className="flex justify-between items-start mb-8 border-b border-border/30 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lock size={10} className="text-muted-foreground" />
              <span className="text-[9px] font-black tracking-[0.3em] text-muted-foreground uppercase">Seth VII // Security Protocol</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
              {politicianName}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                {category}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border ${statusBorder} ${statusBg} mb-2`}>
              <Activity size={12} className={statusColor} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                {isLowScore ? 'Vulnerabilidade Detectada' : 'Consistência Monitorada'}
              </span>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Data da Auditoria: {analysisDate}</p>
          </div>
        </div>

        {/* Score Section - Circular/Modern Impact */}
        <div className="flex flex-col md:flex-row gap-12 items-center mb-10">
          <div className="relative flex-shrink-0">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-border"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * score) / 100}
                className={`${statusColor} transition-all duration-1000 ease-out`}
                strokeLinecap="square"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tracking-tighter">{score}%</span>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Credibilidade</span>
            </div>
            
            {/* Scanlines effect on score */}
            <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Veredito de Inteligência</h3>
              </div>
              <p className="text-lg font-bold leading-tight text-foreground/90">
                {verdict}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 border border-border/50 rounded-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Confiança da Auditoria</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${confidence}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold">{confidence}%</span>
                </div>
              </div>
              <div className="p-3 bg-secondary/30 border border-border/50 rounded-sm">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Protocolo Ativo</p>
                <div className="flex items-center gap-2">
                  <Search size={12} className="text-emerald-500" />
                  <span className="text-xs font-mono font-bold uppercase tracking-tighter">Forense-v2.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Minimalist */}
        <div className="flex items-center justify-between pt-6 border-t border-border/30">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-help">
              <FileText size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Ver Fontes</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity cursor-help">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Validado</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Sistema Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
