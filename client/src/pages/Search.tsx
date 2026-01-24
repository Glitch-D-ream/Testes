import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  User, 
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Search() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <SearchIcon size={20} className="text-blue-600" />
            <span className="font-bold text-lg">Explorar Políticos</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">Quem você quer auditar?</h1>
          <p className="text-slate-500 dark:text-slate-400">Busque por nome ou cargo para ver o histórico de promessas e viabilidade.</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-12">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon size={24} />
          </div>
          <input 
            type="text"
            placeholder="Ex: Deputado Federal, Prefeito de SP, Nome do Político..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-32 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-lg shadow-sm"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((politician, index) => (
              <motion.div
                key={politician.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{politician.name}</h3>
                    <div className="flex gap-3 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><TrendingUp size={12} /> {politician.party}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {politician.state}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">{politician.analysesCount} análises</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Score: {politician.averageScore}%</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : searchTerm && !loading ? (
          <div className="text-center py-20">
            <p className="text-slate-500">Nenhum resultado encontrado para "{searchTerm}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
              <h4 className="font-bold mb-2">Busca Inteligente</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Nossa busca cruza dados do TSE para encontrar políticos por nome, partido ou estado.</p>
            </div>
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
              <h4 className="font-bold mb-2">Histórico Completo</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Veja todas as promessas já analisadas para um candidato específico.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
