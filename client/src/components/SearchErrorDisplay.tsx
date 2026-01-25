import React, { useState } from 'react';
import {
  AlertCircle,
  Lightbulb,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Search
} from 'lucide-react';

interface SearchErrorDisplayProps {
  errorCode: string;
  politicianName: string;
  message: string;
  suggestions: string[];
  fallbackAction?: string;
  onRetry?: () => void;
  onManualSubmit?: () => void;
  isRetrying?: boolean;
  retryDelay?: number;
}

export function SearchErrorDisplay({
  errorCode,
  politicianName,
  message,
  suggestions,
  fallbackAction,
  onRetry,
  onManualSubmit,
  isRetrying = false,
  retryDelay = 0
}: SearchErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [retryCountdown, setRetryCountdown] = useState(retryDelay);

  // Countdown para retentativa automática
  React.useEffect(() => {
    if (retryCountdown <= 0 || !isRetrying) return;

    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1000) {
          onRetry?.();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown, isRetrying, onRetry]);

  const getErrorIcon = () => {
    switch (errorCode) {
      case 'NO_RESULTS':
        return <Search size={24} className="text-amber-600 dark:text-amber-400" />;
      case 'TIMEOUT':
        return <Clock size={24} className="text-orange-600 dark:text-orange-400" />;
      case 'RATE_LIMIT':
        return <RefreshCw size={24} className="text-red-600 dark:text-red-400" />;
      case 'NOT_FOUND':
        return <AlertCircle size={24} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle size={24} className="text-slate-600 dark:text-slate-400" />;
    }
  };

  const getErrorColor = () => {
    switch (errorCode) {
      case 'NO_RESULTS':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30';
      case 'TIMEOUT':
        return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/30';
      case 'RATE_LIMIT':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30';
      case 'NOT_FOUND':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30';
      default:
        return 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800/30';
    }
  };

  const getErrorTitle = () => {
    switch (errorCode) {
      case 'NO_RESULTS':
        return 'Nenhum resultado encontrado';
      case 'TIMEOUT':
        return 'Busca expirou (Timeout)';
      case 'RATE_LIMIT':
        return 'Limite de requisições atingido';
      case 'NOT_FOUND':
        return 'Figura pública não encontrada';
      default:
        return 'Erro na busca';
    }
  };

  return (
    <div className={`rounded-2xl border-2 p-6 ${getErrorColor()} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">{getErrorIcon()}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black uppercase tracking-tight mb-1">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp size={20} className="text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-600 dark:text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="pt-4 border-t border-current/20">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-yellow-600 dark:text-yellow-400" />
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sugestões
                </h4>
              </div>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                        {index + 1}
                      </span>
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                      {suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ação de Fallback */}
          {fallbackAction && (
            <div className="pt-4 border-t border-current/20">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-green-600 dark:text-green-400" />
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alternativa
                </h4>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                {fallbackAction}
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-current/20 flex flex-wrap gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all ${
                  isRetrying
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                }`}
              >
                <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying
                  ? `Tentando novamente em ${Math.ceil(retryCountdown / 1000)}s...`
                  : 'Tentar Novamente'}
              </button>
            )}

            {onManualSubmit && (
              <button
                onClick={onManualSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
              >
                <MessageSquare size={14} />
                Enviar Manualmente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente para exibir status de busca em andamento
 */
export function SearchLoadingState({
  politicianName,
  currentAttempt = 1,
  totalAttempts = 3
}: {
  politicianName: string;
  currentAttempt?: number;
  totalAttempts?: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/10 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black uppercase tracking-tight text-blue-900 dark:text-blue-100 mb-1">
            Buscando informações sobre {politicianName}
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Tentativa {currentAttempt} de {totalAttempts}... Isso pode levar alguns momentos.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para exibir sucesso parcial (alguns resultados encontrados)
 */
export function SearchPartialSuccess({
  politicianName,
  resultsCount,
  onProceed
}: {
  politicianName: string;
  resultsCount: number;
  onProceed: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Lightbulb size={24} className="text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-amber-900 dark:text-amber-100">
              Resultados Limitados Encontrados
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-3">
              Encontramos apenas {resultsCount} resultado(s) sobre "{politicianName}". Isso pode ser porque é uma figura menos conhecida ou local. Você pode continuar com os resultados encontrados ou tentar uma busca manual.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={onProceed}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider bg-amber-600 hover:bg-amber-700 text-white transition-all hover:shadow-lg"
        >
          <Search size={14} />
          Continuar com Resultados
        </button>
      </div>
    </div>
  );
}
