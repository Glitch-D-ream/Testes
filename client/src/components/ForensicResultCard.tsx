
import React from 'react';
import { Shield, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface ForensicResultCardProps {
  politicianName: string;
  score: number;
  verdict: string;
  analysisDate: string;
  confidence: number;
  category: string;
  data?: any; // Para compatibilidade com dados extras
}

export const ForensicResultCard: React.FC<ForensicResultCardProps> = ({
  politicianName,
  score,
  verdict,
  analysisDate,
  confidence,
  category,
  data
}) => {
  const getVerdictColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
    if (score < 40) return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
    return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[2rem] overflow-hidden border border-slate-800/50 shadow-2xl mb-8"
    >
      <div className="bg-slate-900/50 px-8 py-6 border-b border-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Shield className="text-blue-400" size={18} />
          </div>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-[0.2em]">Dossiê Técnico • {category}</h3>
        </div>
        <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">
          v2.6 Ironclad
        </span>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-2">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{politicianName}</h2>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> Auditoria realizada em {analysisDate}
            </p>
          </div>
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${getVerdictColor(score)}`}>
            <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Score de Credibilidade</span>
            <span className="text-4xl font-black uppercase tracking-tight">{score}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Métricas de Confiança</h4>
            <div className="space-y-4">
              <MetricBar label="Rastreabilidade" value={confidence} color="blue" />
              <MetricBar label="Consistência" value={score} color="cyan" />
              <MetricBar label="Transparência" value={Math.min(confidence + 10, 100)} color="indigo" />
            </div>
          </div>
          
          <div className="md:col-span-2 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col justify-center">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Veredito do Seth VII</h4>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {verdict}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
  const colors: any = {
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    indigo: "bg-indigo-500"
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
    </div>
  );
}
