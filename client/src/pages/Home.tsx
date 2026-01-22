import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Moon, Sun } from 'lucide-react';
import AnalysisForm from '../components/AnalysisForm';
import LegalDisclaimer from '../components/LegalDisclaimer';
import { Button } from '../components/Button';
import { useTheme } from '../hooks/useTheme';

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <header className={`${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-slate-200'
      } shadow-sm border-b transition-colors`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Detector de Promessa Vazia
              </h1>
              <p className={`mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Análise independente de viabilidade de promessas políticas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-4">
                <a
                  href="/search"
                  className={`px-4 py-2 font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Buscar Político
                </a>
                <a
                  href="/history"
                  className={`px-4 py-2 font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Histórico
                </a>
                <a
                  href="/methodology"
                  className={`px-4 py-2 font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Metodologia
                </a>
                <a
                  href="/statistics"
                  className={`px-4 py-2 font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Estatísticas
                </a>
              </nav>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                icon={theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <AnalysisForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Info Card */}
            <div className={`rounded-lg shadow p-6 ${
              theme === 'dark'
                ? 'bg-gray-800'
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Como Funciona
              </h3>
              <ul className={`space-y-3 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
              }`}>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  <span>Cole um discurso, post ou texto político</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  <span>Nosso sistema analisa usando PLN avançado</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">3.</span>
                  <span>Cruzamos com dados públicos (orçamentos, histórico)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold">4.</span>
                  <span>Receba probabilidade de cumprimento</span>
                </li>
              </ul>
            </div>

            {/* Features Card */}
            <div className={`rounded-lg shadow p-6 ${
              theme === 'dark'
                ? 'bg-gray-800'
                : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Recursos
              </h3>
              <ul className={`space-y-2 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
              }`}>
                <li>✓ Análise de 6 categorias</li>
                <li>✓ Integração com dados públicos</li>
                <li>✓ Histórico de análises</li>
                <li>✓ Exportação de resultados</li>
                <li>✓ Metodologia transparente</li>
                <li>✓ Conformidade LGPD</li>
              </ul>
            </div>

            {/* Legal Disclaimer */}
            <LegalDisclaimer />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-16 py-8 border-t ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
          }`}>
            © 2026 Detector de Promessa Vazia. Análise independente e transparente.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="/privacy" className={`text-sm hover:underline ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-slate-600 hover:text-slate-900'
            }`}>
              Privacidade
            </a>
            <a href="/terms" className={`text-sm hover:underline ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-slate-600 hover:text-slate-900'
            }`}>
              Termos
            </a>
            <a href="/contact" className={`text-sm hover:underline ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-slate-600 hover:text-slate-900'
            }`}>
              Contato
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
