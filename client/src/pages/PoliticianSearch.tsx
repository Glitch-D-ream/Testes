import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface Politician {
  id: string;
  name: string;
  party: string;
  office: string;
  region: string;
  photoUrl?: string;
  credibilityScore: number;
}

export default function PoliticianSearch() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Politician[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/search/politicians?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getVerdictLabel = (score: number) => {
    if (score >= 75) return 'Confiável';
    if (score >= 50) return 'Duvidoso';
    return 'Risco';
  };

  return (
    <div className={`min-h-screen ${
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
                Buscar Político
              </h1>
              <p className={`mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Consulte o dossiê de promessas e viabilidade
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ← Voltar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className={`rounded-lg shadow-lg p-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Digite o nome do político, partido ou estado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        <div className="space-y-6">
          {hasSearched && results.length === 0 && !isLoading && (
            <div className={`rounded-lg p-8 text-center ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className={`text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
              }`}>
                Nenhum político encontrado. Tente outra busca.
              </p>
            </div>
          )}

          {results.map((politician) => (
            <div
              key={politician.id}
              onClick={() => navigate(`/politician/${politician.id}`)}
              className={`rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    {politician.photoUrl && (
                      <img
                        src={politician.photoUrl}
                        alt={politician.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {politician.name}
                      </h2>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {politician.office} • {politician.party} • {politician.region}
                      </p>
                    </div>
                  </div>

                  {/* Credibility Score */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${getVerdictColor(politician.credibilityScore)}`}>
                        {Math.round(politician.credibilityScore)}%
                      </span>
                      <span className={`text-sm font-medium ${getVerdictColor(politician.credibilityScore)}`}>
                        {getVerdictLabel(politician.credibilityScore)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  politician.credibilityScore >= 75
                    ? 'bg-green-100 text-green-800'
                    : politician.credibilityScore >= 50
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {politician.credibilityScore >= 75 ? '✓ Confiável' : politician.credibilityScore >= 50 ? '⚠ Duvidoso' : '✗ Risco'}
                </div>
              </div>

              <p className={`mt-4 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Clique para ver o dossiê completo com análise de promessas, votações e confronto orçamentário.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
