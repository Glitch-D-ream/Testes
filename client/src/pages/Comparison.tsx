import { useState } from 'react';
import { useComparisonData } from '../hooks/useComparisonData';
import { ComparisonBarChart } from '../components/ComparisonBarChart';
import { PromiseRadarChart } from '../components/PromiseRadarChart';

export function Comparison() {
  const [politician1, setPolitician1] = useState('');
  const [politician2, setPolitician2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { loading, error, data, fetchComparison } = useComparisonData();

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!politician1.trim() || !politician2.trim()) {
      alert('Por favor, preencha os nomes dos dois políticos');
      return;
    }

    try {
      await fetchComparison(politician1, politician2);
      setSubmitted(true);
    } catch (err) {
      console.error('Erro na comparação:', err);
    }
  };

  const prepareComparisonData = () => {
    if (!data) return [];

    const allCategories = new Set([
      ...Object.keys(data.politician1.viabilityByCategory),
      ...Object.keys(data.politician2.viabilityByCategory),
    ]);

    return Array.from(allCategories).map((category) => ({
      category,
      politician1: data.politician1.viabilityByCategory[category] || 0,
      politician2: data.politician2.viabilityByCategory[category] || 0,
    }));
  };

  const prepareRadarData = () => {
    if (!data) return [];

    const allCategories = new Set([
      ...Object.keys(data.politician1.promisesByCategory),
      ...Object.keys(data.politician2.promisesByCategory),
    ]);

    return Array.from(allCategories).map((category) => ({
      category,
      count: Math.max(
        data.politician1.promisesByCategory[category] || 0,
        data.politician2.promisesByCategory[category] || 0
      ),
      viability: Math.max(
        data.politician1.viabilityByCategory[category] || 0,
        data.politician2.viabilityByCategory[category] || 0
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Comparar Políticos</h1>

        {/* Formulário de Comparação */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleCompare} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="politician1" className="block text-sm font-medium text-gray-700">
                  Primeiro Político
                </label>
                <input
                  id="politician1"
                  type="text"
                  value={politician1}
                  onChange={(e) => setPolitician1(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="politician2" className="block text-sm font-medium text-gray-700">
                  Segundo Político
                </label>
                <input
                  id="politician2"
                  type="text"
                  value={politician2}
                  onChange={(e) => setPolitician2(e.target.value)}
                  placeholder="Ex: Maria Santos"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : 'Comparar'}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}

        {submitted && data && (
          <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{data.politician1.name}</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Total de Análises:</span> {data.politician1.totalAnalyses}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Viabilidade Média:</span>{' '}
                    <span className="text-2xl font-bold text-blue-600">
                      {data.politician1.averageViability.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{data.politician2.name}</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Total de Análises:</span> {data.politician2.totalAnalyses}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Viabilidade Média:</span>{' '}
                    <span className="text-2xl font-bold text-red-600">
                      {data.politician2.averageViability.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ComparisonBarChart
                data={prepareComparisonData()}
                politician1Name={data.politician1.name}
                politician2Name={data.politician2.name}
                title="Viabilidade por Categoria"
              />

              <PromiseRadarChart
                data={prepareRadarData()}
                title="Distribuição de Promessas"
              />
            </div>
          </div>
        )}

        {submitted && !data && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma análise encontrada para os políticos selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
