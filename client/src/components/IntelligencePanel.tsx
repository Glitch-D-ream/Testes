import React from 'react';
import { ShieldCheck, AlertTriangle, Search, CheckCircle, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {/* Painel de Consenso Social */}
      {consensusMetrics && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-[2.5rem] p-10 border border-slate-800/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Consenso Social</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validação de Fontes</p>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-5xl font-black text-white tracking-tighter">{consensusMetrics.verifiedCount}</p>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Fontes Convergentes</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 mb-2">Acurácia de Coleta</p>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${(consensusMetrics.verifiedCount / consensusMetrics.sourceCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Painel de Ausência / Viabilidade */}
      {absenceReport && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-[2.5rem] p-10 border border-slate-800/50"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Viabilidade Negativa</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rastreamento de Lacunas</p>
            </div>
          </div>

          <div className="space-y-4">
            {absenceReport.checks.slice(0, 2).map((check, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                {check.status === 'absent' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{check.factor}</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{check.description}</p>
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <p className="text-[11px] font-bold text-amber-400 leading-relaxed">
                <Zap size={12} className="inline mr-2 mb-1" />
                {absenceReport.summary}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
