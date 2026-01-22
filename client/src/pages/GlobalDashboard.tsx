import { useEffect, useState } from 'react';
import { TrendLineChart } from '../components/TrendLineChart';
import { PromiseRadarChart } from '../components/PromiseRadarChart';

interface GlobalStats {
  totalAnalyses: number;
  totalPromises: number;
  averageViability: number;
  categoriesDistribution: Record<string, number>;
  viabilityByCategory: Record<string, number>;
  trends: Array<{
    date: string;
    viability: number;
    count: number;
  }>;
}

export function GlobalDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/statistics');
        if (!response.ok) throw new Error('Erro ao buscar estatísticas');

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">Nenhuma estatística disponível</p>
        </div>
      </div>
    );
  }

  const radarData = Object.entries(stats.categoriesDistribution).map(([category, count]) => ({
    category,
    count,
    viability: stats.viabilityByCategory[category] || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard Global</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Total de Análises</p>
            <p className="text-4xl font-bold text-blue-600">{stats.totalAnalyses}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Promessas Identificadas</p>
            <p className="text-4xl font-bold text-green-600">{stats.totalPromises}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Viabilidade Média</p>
            <p className="text-4xl font-bold text-purple-600">
              {(stats.averageViability * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Categorias Analisadas</p>
            <p className="text-4xl font-bold text-orange-600">
              {Object.keys(stats.categoriesDistribution).length}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PromiseRadarChart data={radarData} title="Distribuição por Categoria" />

          {stats.trends.length > 0 && (
            <TrendLineChart data={stats.trends} title="Tendências ao Longo do Tempo" />
          )}
        </div>

        {/* Tabela de Categorias */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes por Categoria</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Categoria</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Promessas</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Viabilidade Média</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.categoriesDistribution).map(([category, count]) => (
                  <tr key={category} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{category}</td>
                    <td className="text-right py-3 px-4 text-gray-600">{count}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {((stats.viabilityByCategory[category] || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
