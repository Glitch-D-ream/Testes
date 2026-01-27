import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Tag, ChevronRight, Shield, Activity } from 'lucide-react';

export default function RecentAudits() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analyze?limit=3`);
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data.analyses || []);
        }
      } catch (err) {
        console.error('Erro ao carregar auditorias recentes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando com a Rede...</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="p-20 text-center">
        <p className="text-slate-500 font-medium italic">Nenhuma auditoria recente encontrada.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/50">
      {analyses.map((analysis, index) => (
        <motion.div
          key={analysis.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => navigate(`/analysis/${analysis.id}`)}
          className="group p-8 hover:bg-blue-500/[0.02] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-slate-900 text-slate-500 text-[9px] font-black rounded-full border border-slate-800 uppercase flex items-center gap-1.5 tracking-widest">
                <Calendar size={10} /> {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-full border border-blue-500/20 uppercase flex items-center gap-1.5 tracking-widest">
                <Tag size={10} /> {analysis.category || 'Auditoria Forense'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors flex items-center gap-3 tracking-tight">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              {analysis.author || 'Alvo Não Identificado'}
            </h3>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-3xl font-black text-white tracking-tighter">
                {Math.round(analysis.probability_score)}<span className="text-sm text-blue-500 ml-0.5">%</span>
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Credibilidade</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-xl">
              <ChevronRight size={24} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
