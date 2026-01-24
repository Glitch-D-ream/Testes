import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Search, 
  ChevronRight,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analyze`);
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data.analyses || []);
        }
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredAnalyses = analyses.filter(a => 
    a.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <HistoryIcon size={20} className="text-blue-600" />
            <span className="font-bold text-lg">Arquivo de Auditorias</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black mb-2">Histórico Público</h1>
            <p className="text-slate-500 dark:text-slate-400">Consulte auditorias realizadas anteriormente pela comunidade.</p>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Buscar por político ou palavra-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAnalyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                      <Calendar size={10} /> {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                      <Tag size={10} /> {analysis.category || 'Geral'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors flex items-center gap-2">
                    <User size={18} className="text-slate-400" /> {analysis.author || 'Autor Não Identificado'}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-1 italic">
                    "{analysis.text}"
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {Math.round(analysis.probability_score)}<span className="text-sm text-slate-400">%</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Viabilidade</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <HistoryIcon size={32} />
            </div>
            <h3 className="text-lg font-bold">Nenhuma auditoria encontrada</h3>
            <p className="text-slate-500">Tente buscar por outro termo ou realize uma nova análise.</p>
          </div>
        )}
      </main>
    </div>
  );
}
