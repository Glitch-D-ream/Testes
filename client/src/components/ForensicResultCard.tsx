
import React from 'react';
import { Shield, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
  category,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-b from-blue-600/20 to-transparent rounded-2xl blur-xl opacity-50"></div>
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Identification Bar */}
        <div className="bg-slate-900/50 border-b border-slate-800 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Relatório de Inteligência Forense</p>
              <p className="text-xs font-bold text-slate-400">Ref: {analysisDate.replace(/\//g, '')}-IRONCLAD / v3.0</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status da Auditoria</p>
            <div className="flex items-center gap-2 justify-end">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-black text-emerald-500 uppercase">Dossiê Consolidado</span>
            </div>
          </div>
        </div>

        <div className="p-10 flex flex-col lg:flex-row gap-12">
          {/* Main Identity */}
          <div className="flex-1 space-y-8">
            <div className="space-y-2">
              <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
                {politicianName}
              </h2>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ALVO DE ALTA PRIORIDADE
                </span>
                <span className="text-sm text-slate-500 font-medium tracking-tight">Data da Análise: {analysisDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Activity size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Quadro Executivo</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {verdict}
                </p>
              </div>
              
              <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-xl space-y-6">
                <div className="flex items-center gap-2 text-cyan-400">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Métricas de Exposição</span>
                </div>
                <div className="space-y-4">
                  <MetricBar label="Rastreabilidade" value={confidence} color="bg-blue-500" />
                  <MetricBar label="Densidade de Dados" value={85} color="bg-cyan-500" />
                  <MetricBar label="Risco de Incoerência" value={100 - score} color="bg-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center lg:border-l lg:border-slate-800 lg:pl-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-900"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={553}
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white tracking-tighter">{score}%</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credibilidade</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Veredito Forense</p>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                score >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                score >= 40 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {score >= 70 ? 'Viável / Estável' : score >= 40 ? 'Risco Moderado' : 'Crítico / Inconsistente'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}
