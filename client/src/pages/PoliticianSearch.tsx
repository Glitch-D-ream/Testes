import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePoliticianSearch } from '../hooks/usePoliticianSearch';

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
  const [hasSearched, setHasSearched] = useState(false);
  const { results, isLoading, error, search } = usePoliticianSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    try {
      await search(searchQuery);
    } catch (err) {
      console.error('Erro na busca:', err);
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
      } shadow-sm border-b transition-colors sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className={`text-2xl md:text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Buscar Político
              </h1>
              <p className={`mt-1 text-sm md:text-base ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Consulte o dossiê de promessas e viabilidade
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
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
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8 md:mb-12">
          <div className={`rounded-lg shadow-lg p-6 md:p-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex flex-col md:flex-row gap-4">
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
                className="px-6 md:px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className={`rounded-lg p-6 mb-8 ${
            theme === 'dark' ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'
          } border ${theme === 'dark' ? 'border-red-700' : 'border-red-200'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={theme === 'dark' ? 'text-red-400' : 'text-red-600'} />
              <p className={theme === 'dark' ? 'text-red-300' : 'text-red-800'}>
                {error}
              </p>
            </div>
          </div>
        )}

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

          {results.map((politician: Politician) => (
            <div
              key={politician.id}
              onClick={() => navigate(`/politician/${politician.id}`)}
              className={`rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start gap-4 mb-4">
                    {politician.photoUrl && (
                      <img
                        src={politician.photoUrl}
                        alt={politician.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-xl md:text-2xl font-bold truncate ${
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
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl md:text-3xl font-bold ${getVerdictColor(politician.credibilityScore)}`}>
                        {Math.round(politician.credibilityScore)}%
                      </span>
                      <span className={`text-sm font-medium ${getVerdictColor(politician.credibilityScore)}`}>
                        {getVerdictLabel(politician.credibilityScore)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 ${
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
