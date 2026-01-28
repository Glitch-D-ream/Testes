
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Globe, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    title: string;
    icon: React.ReactNode;
    desc: string;
    details: string[];
    technical: string;
    color: string;
  } | null;
}

export default function AgentModal({ isOpen, onClose, agent }: AgentModalProps) {
  if (!agent) return null;

  const colors: any = {
    blue: "from-blue-600 to-blue-400 shadow-blue-500/20",
    cyan: "from-cyan-600 to-cyan-400 shadow-cyan-500/20",
    indigo: "from-indigo-600 to-indigo-400 shadow-indigo-500/20"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header Decor */}
            <div className={`h-2 w-full bg-gradient-to-r ${colors[agent.color]}`} />
            
            <div className="p-8 sm:p-12">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex items-start gap-6 mb-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors[agent.color]} text-white shadow-lg`}>
                  {agent.icon}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">{agent.title}</h2>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Agente Especializado Seth VII</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Missão do Agente</h4>
                  <p className="text-slate-300 leading-relaxed text-lg font-medium">
                    {agent.desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {agent.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <CheckCircle2 className="text-blue-500 shrink-0" size={18} />
                      <span className="text-sm text-slate-400 font-medium">{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Cpu size={12} /> Especificação Técnica
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {agent.technical}
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700"
                >
                  Entendido
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
