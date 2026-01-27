import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, BarChart3, PieChart as PieChartIcon, TrendingUp, 
  Users, Target, AlertCircle, Activity, Download, ChevronRight,
  ShieldCheck, Database, Cpu, Search, History, FileText,
  LayoutDashboard, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { useDarkMode } from '../hooks/useDarkMode';

interface Analysis {
  id: string;
  author: string;
  category: string;
  probability_score: number;
  created_at: string;
}

interface DashboardStats {
  totalAnalyses: number;
  totalPromises: number;
  averageConfidence: number;
  totalAuthors: number;
  byCategory: Array<{ category: string; count: number }>;
  alerts?: Array<{
    id: string;
    author: string;
    category: string;
    severity: 'high' | 'medium';
    message: string;
    date: string;
  }>;
}

/**
 * Dashboard de Análises Seth VII
 * Versão Restaurada e Melhorada (Jan 2026)
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Buscar estatísticas globais
      const statsRes = await fetch(`${apiUrl}/api/statistics`);
      if (!statsRes.ok) throw new Error('Falha ao carregar estatísticas');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Buscar análises recentes
      const analysesRes = await fetch(`${apiUrl}/api/analyze?limit=5`);
      if (analysesRes.ok) {
        const analysesData = await analysesRes.json();
        setRecentAnalyses(analysesData.analyses || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando Auditoria Global...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-8 max-w-md w-full shadow-xl">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Erro de Conexão</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-8">{error}</p>
          <Button fullWidth onClick={fetchDashboardData} variant="primary">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const categoryColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white" size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight dark:text-white">Seth VII</span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => navigate('/search')} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <Search size={16} /> Buscar
                </button>
                <button onClick={() => navigate('/history')} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <History size={16} /> Histórico
                </button>
                <button onClick={() => navigate('/methodology')} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <FileText size={16} /> Metodologia
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/')} icon={<ArrowLeft size={16} />}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <motion.main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6" variants={itemVariants}>
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">
              <LayoutDashboard size={16} /> Painel de Controle
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Métricas Globais <span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl font-medium">
              Consolidado técnico de todas as auditorias realizadas pelos agentes autônomos do Seth VII.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={<Download size={18} />}>Exportar Relatório</Button>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
            value={`${((stats?.averageConfidence || 0) * 100).toFixed(1)}%`} 
            icon={<TrendingUp className="text-indigo-600" size={20} />}
            desc="Score global de confiança"
            variants={itemVariants}
            progress={(stats?.averageConfidence || 0) * 100}
          />
          <StatCard 
            title="Políticos Auditados" 
            value={stats?.totalAuthors || 0} 
            icon={<Users className="text-amber-600" size={20} />}
            desc="Indivíduos analisados"
            variants={itemVariants}
          />
        </div>

        {/* Alertas de Contradição */}
        {stats?.alerts && stats.alerts.length > 0 && (
          <motion.div className="mb-12" variants={itemVariants}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-8 bg-amber-500 rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Alertas de Contradição Temporal</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${
                    alert.severity === 'high' 
                      ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' 
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      alert.severity === 'high' 
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' 
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    }`}>
                      {alert.severity === 'high' ? 'Risco Crítico' : 'Atenção Técnica'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(alert.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white mb-1">{alert.author}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{alert.message}</p>
                  <button 
                    onClick={() => navigate(`/analysis/${alert.id}`)}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                  >
                    VER AUDITORIA COMPLETA <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Categories Chart */}
          <motion.div 
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
                <PieChartIcon size={20} className="text-blue-600" /> Distribuição por Categoria
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.byCategory}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {stats?.byCategory?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        fontWeight: 'bold'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {stats?.byCategory?.slice(0, 5).map((cat: any, index: number) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
                        <span className="text-slate-600 dark:text-slate-300">{cat.category}</span>
                      </div>
                      <span className="text-slate-400">{cat.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.count / (stats?.totalPromises || 1)) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Methodology Card */}
          <motion.div 
            className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden"
            variants={itemVariants}
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight">Metodologia Seth VII</h3>
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">
                Nossa auditoria não é baseada em opiniões, mas em cruzamento massivo de dados orçamentários e históricos.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-white/20 p-1 rounded-md"><Database size={14} /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">SICONFI & IBGE</p>
                    <p className="text-[10px] text-blue-100 font-medium">Dados reais do Tesouro Nacional.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-white/20 p-1 rounded-md"><Cpu size={14} /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">IA DEEPSEEK R1</p>
                    <p className="text-[10px] text-blue-100 font-medium">Raciocínio lógico para detecção de falácias.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </motion.div>
        </div>

        {/* Recent Analyses Table */}
        <motion.div 
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2 dark:text-white">
              <History size={20} className="text-blue-600" /> Auditorias Recentes
            </h3>
            <button 
              onClick={() => navigate('/history')}
              className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              Ver Tudo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left pb-4 px-2">Político</th>
                  <th className="text-left pb-4 px-2">Categoria</th>
                  <th className="text-left pb-4 px-2">Viabilidade</th>
                  <th className="text-left pb-4 px-2">Data</th>
                  <th className="text-right pb-4 px-2">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-2">
                      <div className="font-black text-slate-900 dark:text-white text-sm">{analysis.author}</div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                        {analysis.category}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              analysis.probability_score > 0.7 ? 'bg-emerald-500' : 
                              analysis.probability_score > 0.4 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${analysis.probability_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                          {(analysis.probability_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-xs font-bold text-slate-400">
                      {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                        className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}

function StatCard({ title, value, icon, desc, variants, progress }: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  desc: string, 
  variants: any,
  progress?: number
}) {
  return (
    <motion.div 
      className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
      variants={variants}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">{value}</div>
      
      {progress !== undefined ? (
        <div className="mt-3">
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-2">{desc}</p>
        </div>
      ) : (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{desc}</p>
      )}
    </motion.div>
  );
}

export default Dashboard;
