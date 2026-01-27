import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Analysis {
  id: string;
  text: string;
  author: string;
  category: string;
  probabilityScore: number;
  promisesCount: number;
  createdAt: string;
}

interface DashboardStats {
  totalAnalyses: number;
  averageConfidence: number;
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
 * Dashboard de Análises
 * Exibe estatísticas, gráficos e histórico de análises realizadas
 */
export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics');

      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Erro ao carregar dashboard</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const categoryColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard de Análises</h1>
          <p className="text-gray-600">Estatísticas e tendências de promessas políticas analisadas</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Analyses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total de Análises</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalAnalyses}</p>
              </div>
              <div className="text-5xl text-blue-100">📊</div>
            </div>
          </div>

          {/* Average Probability */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Confiança Média</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-5xl text-green-100">📈</div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.averageConfidence * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Categories Count */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Categorias Analisadas</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.byCategory.length}
                </p>
              </div>
              <div className="text-5xl text-purple-100">🏷️</div>
            </div>
          </div>
        </div>

        {/* Alertas de Contradição Temporal */}
        {stats.alerts && stats.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚠️</span> Alertas de Contradição Temporal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'high' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {alert.severity === 'high' ? 'Crítico' : 'Atenção'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(alert.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{alert.author}</p>
                  <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
                  <a 
                    href={`/analysis/${alert.id}`} 
                    className="text-xs text-blue-600 font-bold mt-3 inline-block hover:underline"
                  >
                    Ver Auditoria Completa →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Categories Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metodologia Seth VII</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              O Seth VII utiliza uma tríade de agentes (Scout, Filter, Brain) para auditar promessas políticas. 
              Nossas métricas agora incluem:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold">✓</span> <strong>Consenso:</strong> Validação cruzada de múltiplas fontes.
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold">✓</span> <strong>Trajetória:</strong> Análise estatística de 5 anos de orçamentos.
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold">✓</span> <strong>Ausência:</strong> Busca por fatores críticos inexistentes.
              </li>
            </ul>
          </div>
        </div>



        {/* Export Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exportar Dados</h3>
          <p className="text-gray-600 mb-4">
            Exporte todas as análises e estatísticas em formato JSON para análise externa
          </p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            📥 Exportar como JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
