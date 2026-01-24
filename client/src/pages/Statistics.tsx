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
  Activity
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
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
            <BarChart3 size={20} className="text-blue-600" />
            <span className="font-bold text-lg">Painel de Transparência</span>
          </div>
        </div>
      </header>

      <motion.main 
        className="max-w-5xl mx-auto px-4 pt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-12" variants={itemVariants}>
          <h1 className="text-3xl font-black mb-4">Métricas Globais</h1>
          <p className="text-slate-500 dark:text-slate-400">Dados consolidados de todas as auditorias realizadas pelo sistema.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total de Análises" 
            value={stats?.totalAnalyses || 0} 
            icon={<Activity className="text-blue-600" size={20} />}
            desc="Auditorias processadas"
            variants={itemVariants}
          />
          <StatCard 
            title="Promessas Detectadas" 
            value={stats?.totalPromises || 0} 
            icon={<Target className="text-emerald-600" size={20} />}
            desc="Compromissos reais"
            variants={itemVariants}
          />
          <StatCard 
            title="Viabilidade Média" 
            value={`${(stats?.averageConfidence || 0).toFixed(1)}%`} 
            icon={<TrendingUp className="text-indigo-600" size={20} />}
            desc="Score global de confiança"
            variants={itemVariants}
          />
          <StatCard 
            title="Políticos Auditados" 
            value={stats?.totalAuthors || 0} 
            icon={<Users className="text-amber-600" size={20} />}
            desc="Indivíduos analisados"
            variants={itemVariants}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories Chart */}
          <motion.div 
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" /> Distribuição por Categoria
            </h3>
            <div className="space-y-4">
              {stats?.byCategory?.map((cat: any) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{cat.category}</span>
                    <span className="text-slate-400">{cat.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.count / stats.totalPromises) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Alert Card */}
          <motion.div 
            className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-8 border border-amber-100 dark:border-amber-900/20"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 text-amber-900 dark:text-amber-100">Observação Técnica</h3>
            <p className="text-sm text-amber-800/70 dark:text-amber-200/60 leading-relaxed">
              Os dados apresentados aqui são atualizados em tempo real. O score de viabilidade média reflete a realidade orçamentária do país frente às promessas feitas pelos agentes políticos.
            </p>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}

function StatCard({ title, value, icon, desc, variants }: { title: string, value: string | number, icon: React.ReactNode, desc: string, variants: any }) {
  return (
    <motion.div 
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
      variants={variants}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
      <div className="text-3xl font-black mb-2">{value}</div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{desc}</p>
    </motion.div>
  );
}
