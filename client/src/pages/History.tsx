import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  author?: string;
  category?: string;
  probability_score: number;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/analyses');
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskColor = (score: number) => {
    if (score >= 65) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Histórico de Análises</h1>
              <p className="text-slate-600 mt-1">Todas as análises realizadas</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Nova Análise
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando histórico...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-600 mb-4">Nenhuma análise realizada ainda</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Realizar Primeira Análise
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Probabilidade
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analyses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.author || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(item.probability_score)}`}>
                        {item.probability_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/analysis/${item.id}`)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Ver Detalhes →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
