import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AnalysisData {
  id: string;
  text: string;
  author?: string;
  category?: string;
  extracted_promises: any[];
  probability_score: number;
  promises: any[];
  disclaimer: string;
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${id}`);
        if (!response.ok) {
          throw new Error('Análise não encontrada');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        toast.error('Erro ao carregar análise');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analysis/${id}/export`);
      if (!response.ok) throw new Error('Erro ao exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analise-${id}.json`;
      a.click();
      toast.success('Análise exportada com sucesso!');
    } catch (err) {
      toast.error('Erro ao exportar análise');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Voltar
            </button>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Erro ao carregar análise'}</p>
          </div>
        </div>
      </div>
    );
  }

  const riskColor = data.probability_score >= 65 ? 'green' : data.probability_score >= 40 ? 'yellow' : 'red';
  const riskLabel = data.probability_score >= 65 ? 'Baixo' : data.probability_score >= 40 ? 'Médio' : 'Alto';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Voltar
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Exportar JSON
              </button>
              <a
                href="/history"
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
              >
                Histórico
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Score Card */}
        <div className={`bg-${riskColor}-50 border-2 border-${riskColor}-200 rounded-lg p-8 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Probabilidade de Cumprimento
              </h1>
              <p className={`text-lg font-medium text-${riskColor}-700`}>
                Risco: {riskLabel}
              </p>
            </div>
            <div className={`text-6xl font-bold text-${riskColor}-600`}>
              {data.probability_score}%
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-8">
          <p className="text-sm text-blue-700">
            <strong>Aviso:</strong> {data.disclaimer}
          </p>
        </div>

        {/* Texto Original */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Texto Analisado</h2>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-slate-700 whitespace-pre-wrap">{data.text}</p>
          </div>
          {data.author && (
            <p className="text-sm text-slate-600 mt-4">
              <strong>Autor:</strong> {data.author}
            </p>
          )}
          {data.category && (
            <p className="text-sm text-slate-600">
              <strong>Categoria:</strong> {data.category}
            </p>
          )}
        </div>

        {/* Promessas Extraídas */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Promessas Extraídas ({data.extracted_promises.length})
          </h2>
          {data.extracted_promises.length > 0 ? (
            <div className="space-y-4">
              {data.extracted_promises.map((promise, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-slate-900 font-medium flex-1">{promise.text}</p>
                    <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
                      {Math.round(promise.confidence * 100)}% confiança
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <strong>Categoria:</strong> {promise.category}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Nenhuma promessa foi extraída do texto.</p>
          )}
        </div>

        {/* Metodologia */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Metodologia</h2>
          <div className="space-y-4 text-sm text-slate-700">
            <p>
              A probabilidade de cumprimento é calculada considerando múltiplos fatores:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Especificidade da promessa (números, prazos, metas claras)</li>
              <li>Conformidade histórica de promessas similares</li>
              <li>Viabilidade orçamentária baseada em dados públicos</li>
              <li>Realismo do prazo proposto</li>
              <li>Histórico do autor (quando disponível)</li>
            </ul>
            <p>
              <a href="/methodology" className="text-blue-600 hover:text-blue-700 font-medium">
                Ver documentação completa da metodologia →
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
