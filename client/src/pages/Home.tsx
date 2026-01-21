import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AnalysisForm from '../components/AnalysisForm';
import LegalDisclaimer from '../components/LegalDisclaimer';

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    text: string;
    author?: string;
    category?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar análise');
      }

      const result = await response.json();
      toast.success('Análise realizada com sucesso!');
      navigate(`/analysis/${result.analysisId}`);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar análise. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Detector de Promessa Vazia
              </h1>
              <p className="text-slate-600 mt-1">
                Análise independente de viabilidade de promessas políticas
              </p>
            </div>
            <nav className="flex gap-4">
              <a
                href="/history"
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
              >
                Histórico
              </a>
              <a
                href="/methodology"
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
              >
                Metodologia
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Submeta um Discurso ou Texto para Análise
              </h2>
              <AnalysisForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Como Funciona
              </h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Cole um discurso, post ou texto político</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Nosso motor de PLN extrai as promessas</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>Calculamos a probabilidade de cumprimento</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    4
                  </span>
                  <span>Visualize resultados com transparência total</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12">
          <LegalDisclaimer />
        </div>
      </main>
    </div>
  );
}
