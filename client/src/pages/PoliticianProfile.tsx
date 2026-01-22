import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface AuditReport {
  promise: string;
  category: string;
  viabilityScore: number;
  budgetContext: {
    totalBudget: number;
    executedBudget: number;
    executionRate: number;
  };
  politicalConsistency: {
    votedAgainstTheme: boolean;
    relevantVotes: any[];
  };
  verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA';
  explanation: string;
}

interface Politician {
  id: string;
  name: string;
  party: string;
  office: string;
  region: string;
  photoUrl?: string;
  bio?: string;
  credibilityScore: number;
}

export default function PoliticianProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [politician, setPolitician] = useState<Politician | null>(null);
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPoliticianData = async () => {
      try {
        // Simulação de dados para demonstração
        setPolitician({
          id: id || '',
          name: 'Nikolas Ferreira',
          party: 'PL',
          office: 'Deputado Federal',
          region: 'MG',
          photoUrl: 'https://www.camara.leg.br/internet/deputado/bandep/209787.jpg',
          bio: 'Deputado Federal mais votado do Brasil em 2022. Natural de Belo Horizonte, Minas Gerais.',
          credibilityScore: 45
        });

        // Simulação de auditoria
        setAudits([
          {
            promise: 'Vou garantir que o orçamento da educação básica seja dobrado até 2027.',
            category: 'Educação',
            viabilityScore: 15,
            budgetContext: {
              totalBudget: 180_000_000_000,
              executedBudget: 148_500_000_000,
              executionRate: 82.5
            },
            politicalConsistency: {
              votedAgainstTheme: true,
              relevantVotes: [
                { data: '2023-12-15', tema: 'Fundeb', voto: 'Não', descricao: 'Manutenção de repasses obrigatórios' }
              ]
            },
            verdict: 'VAZIA',
            explanation: 'Esta promessa é classificada como VAZIA porque o deputado votou contra o Fundeb em 2023 e dobrar o orçamento é matematicamente inviável sem reforma tributária.'
          },
          {
            promise: 'Vou combater a corrupção com rigor absoluto.',
            category: 'Segurança',
            viabilityScore: 65,
            budgetContext: {
              totalBudget: 45_000_000_000,
              executedBudget: 38_250_000_000,
              executionRate: 85
            },
            politicalConsistency: {
              votedAgainstTheme: false,
              relevantVotes: []
            },
            verdict: 'DUVIDOSA',
            explanation: 'Promessa genérica sem indicadores específicos, mas o histórico de votações não apresenta inconsistências.'
          }
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPoliticianData();
  }, [id]);

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'REALISTA':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'DUVIDOSA':
        return <Clock className="text-yellow-500" size={24} />;
      case 'VAZIA':
        return <AlertTriangle className="text-red-500" size={24} />;
      default:
        return null;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'REALISTA':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'DUVIDOSA':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'VAZIA':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'
      }`}>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>Carregando...</p>
      </div>
    );
  }

  if (!politician) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'
      }`}>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}>Político não encontrado.</p>
      </div>
    );
  }

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
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-4 font-medium transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div className="flex items-start gap-6">
            {politician.photoUrl && (
              <img
                src={politician.photoUrl}
                alt={politician.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className={`text-4xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {politician.name}
              </h1>
              <p className={`mt-2 text-lg ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                {politician.office} • {politician.party} • {politician.region}
              </p>
              {politician.bio && (
                <p className={`mt-3 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  {politician.bio}
                </p>
              )}
            </div>

            {/* Credibility Score Card */}
            <div className={`rounded-lg p-6 text-center ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-white'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Score de Credibilidade
              </p>
              <p className={`text-4xl font-bold ${
                politician.credibilityScore >= 75 ? 'text-green-500' :
                politician.credibilityScore >= 50 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {Math.round(politician.credibilityScore)}%
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Promessas Analisadas
              </p>
              <p className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {audits.length}
              </p>
            </div>
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Promessas Viáveis
              </p>
              <p className="text-3xl font-bold text-green-500">
                {audits.filter(a => a.verdict === 'REALISTA').length}
              </p>
            </div>
            <div className={`rounded-lg p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Promessas Vazias
              </p>
              <p className="text-3xl font-bold text-red-500">
                {audits.filter(a => a.verdict === 'VAZIA').length}
              </p>
            </div>
          </div>

          {/* Audits */}
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Análise de Promessas
            </h2>

            {audits.map((audit, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-6 ${
                  getVerdictColor(audit.verdict)
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  {getVerdictIcon(audit.verdict)}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">
                      {audit.promise}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-opacity-20 bg-current rounded-full text-sm font-medium">
                        {audit.category}
                      </span>
                      <span className="text-lg font-bold">
                        Viabilidade: {audit.viabilityScore}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium opacity-75 mb-2">Veredito</p>
                    <p className="text-2xl font-bold">
                      {audit.verdict === 'REALISTA' ? '✓' : audit.verdict === 'DUVIDOSA' ? '?' : '✗'}
                    </p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-4 p-4 bg-opacity-10 bg-current rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {audit.explanation}
                  </p>
                </div>

                {/* Budget Context */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="opacity-75 mb-1">Orçamento Total</p>
                    <p className="font-bold">
                      R$ {(audit.budgetContext.totalBudget / 1e9).toFixed(1)}B
                    </p>
                  </div>
                  <div>
                    <p className="opacity-75 mb-1">Executado</p>
                    <p className="font-bold">
                      R$ {(audit.budgetContext.executedBudget / 1e9).toFixed(1)}B
                    </p>
                  </div>
                  <div>
                    <p className="opacity-75 mb-1">Taxa de Execução</p>
                    <p className="font-bold">
                      {audit.budgetContext.executionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Political Consistency */}
                {audit.politicalConsistency.votedAgainstTheme && (
                  <div className="mt-4 p-4 bg-red-100 bg-opacity-20 border border-red-300 border-opacity-30 rounded-lg">
                    <p className="text-sm font-bold mb-2">⚠️ Inconsistência Detectada</p>
                    {audit.politicalConsistency.relevantVotes.map((vote, idx) => (
                      <p key={idx} className="text-sm opacity-90">
                        [{vote.data}] Votou "{vote.voto}" em {vote.tema}: {vote.descricao}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
