
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Target,
  AlertCircle,
  Activity,
  Shield
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/statistics`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20 selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar ao Início
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-500" size={16} />
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">Seth VII • Central de Dados</span>
          </div>
        </div>
      </header>

      <motion.main 
        className="max-w-7xl mx-auto px-4 pt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-16" variants={itemVariants}>
          <h1 className="text-5xl font-black mb-4 tracking-tight">Inteligência <span className="text-gradient">Estratégica</span></h1>
          <p className="text-slate-400 font-medium max-w-2xl">Monitoramento global de auditorias e consistência política processada pela rede de agentes Seth VII.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <StatCard 
            title="Total de Análises" 
            value={stats?.totalAnalyses || 0} 
            icon={<Activity size={24} />}
            desc="Dossiês processados"
            variants={itemVariants}
          />
          <StatCard 
            title="Promessas" 
            value={stats?.totalPromises || 0} 
            icon={<Target size={24} />}
            desc="Compromissos mapeados"
            variants={itemVariants}
          />
          <StatCard 
            title="Confiança Média" 
            value={`${(stats?.averageConfidence || 0).toFixed(1)}%`} 
            icon={<TrendingUp size={24} />}
            desc="Score global de viabilidade"
            variants={itemVariants}
          />
          <StatCard 
            title="Alvos Auditados" 
            value={stats?.totalAuthors || 0} 
            icon={<Users size={24} />}
            desc="Políticos na base de dados"
            variants={itemVariants}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories Chart */}
          <motion.div 
            className="lg:col-span-2 glass rounded-[2.5rem] p-10 border border-slate-800/50"
            variants={itemVariants}
          >
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
              <PieChart size={22} className="text-blue-500" /> Distribuição Temática
            </h3>
            <div className="space-y-6">
              {stats?.byCategory?.map((cat: any) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">{cat.category}</span>
                    <span className="text-blue-400">{cat.count} ocorrências</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.count / stats.totalPromises) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div 
            className="glass rounded-[2.5rem] p-10 border border-blue-500/20 bg-blue-500/5"
            variants={itemVariants}
          >
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-8">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-2xl font-black mb-6 text-white tracking-tight">Vigilância Digital</h3>
            <p className="text-slate-400 font-medium leading-relaxed mb-6">
              Estes dados refletem a atividade consolidada da rede Seth VII. O score de confiança é recalculado a cada nova auditoria orçamentária.
            </p>
            <div className="pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Dados em tempo real
              </div>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
