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
  averageProbability: number;
  categoriesBreakdown: Array<{ category: string; count: number }>;
  probabilityDistribution: Array<{ range: string; count: number }>;
  recentAnalyses: Analysis[];
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
      const response = await fetch('/api/dashboard/stats');

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
                <p className="text-gray-600 text-sm font-medium">Probabilidade Média</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {(stats.averageProbability * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-5xl text-green-100">📈</div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.averageProbability * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Categories Count */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Categorias Analisadas</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.categoriesBreakdown.length}
                </p>
              </div>
              <div className="text-5xl text-purple-100">🏷️</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Categories Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoriesBreakdown}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.categoriesBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Probability Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição de Probabilidade</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.probabilityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Análises Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Autor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Promessas</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Probabilidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{analysis.author}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {analysis.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{analysis.promisesCount}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${analysis.probabilityScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900 font-medium">
                          {(analysis.probabilityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/analysis/${analysis.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver detalhes
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
