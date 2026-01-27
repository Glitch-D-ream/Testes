
import React from 'react';
import { Terminal, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ForensicTextReportProps {
  verdict: {
    summary: string;
    score: number;
    level: 'CRÍTICO' | 'ALERTA' | 'ESTÁVEL';
  };
  keyFindings: Array<{
    title: string;
    content: string;
    isContradiction: boolean;
  }>;
  technicalAnalysis: string;
}

export const ForensicTextReport: React.FC<ForensicTextReportProps> = ({
  verdict,
  keyFindings,
  technicalAnalysis
}) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRÍTICO': return 'text-red-500 border-red-500/20 bg-red-500/5';
      case 'ALERTA': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Veredito Executivo */}
      <div className={`p-8 border-2 rounded-2xl ${getLevelColor(verdict.level)}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert size={32} />
            <h2 className="text-3xl font-black tracking-tighter uppercase">Parecer Técnico</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Score de Credibilidade</p>
            <p className="text-4xl font-black">{verdict.score}%</p>
          </div>
        </div>
        <p className="text-xl font-bold leading-tight">
          {verdict.summary}
        </p>
      </div>

      {/* Achados Principais (Bullets Forenses) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keyFindings.map((finding, idx) => (
          <div key={idx} className="p-6 bg-card border border-border rounded-xl hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {finding.isContradiction ? (
                <AlertCircle size={18} className="text-red-500" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-500" />
              )}
              <h4 className="text-xs font-black uppercase tracking-widest">{finding.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.content}
            </p>
          </div>
        ))}
      </div>

      {/* Análise Técnica Profunda */}
      <div className="p-8 bg-black border border-border rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Terminal size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Deep Audit Analysis</h3>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {technicalAnalysis}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
