import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface AnalysisTextBlockProps {
  title: string;
  content: string;
  type?: 'reasoning' | 'evidence' | 'risk' | 'methodology' | 'default';
  expandable?: boolean;
  maxLines?: number;
  icon?: React.ReactNode;
}

/**
 * Componente para melhorar a legibilidade de blocos de texto de análise
 * Fornece:
 * - Formatação clara e estruturada
 * - Expansão/colapso para textos longos
 * - Cópia para área de transferência
 * - Diferentes estilos por tipo de conteúdo
 */
export function AnalysisTextBlock({
  title,
  content,
  type = 'default',
  expandable = true,
  maxLines = 3,
  icon
}: AnalysisTextBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const lines = content.split('\n');
  const shouldShowExpand = expandable && lines.length > maxLines;
  const displayContent = isExpanded ? content : lines.slice(0, maxLines).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Estilos por tipo
  const typeStyles = {
    reasoning: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/30',
      title: 'text-blue-900 dark:text-blue-100',
      titleBg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-900 dark:text-blue-100',
      accent: 'text-blue-600 dark:text-blue-400'
    },
    evidence: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800/30',
      title: 'text-emerald-900 dark:text-emerald-100',
      titleBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-900 dark:text-emerald-100',
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    risk: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/30',
      title: 'text-red-900 dark:text-red-100',
      titleBg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-900 dark:text-red-100',
      accent: 'text-red-600 dark:text-red-400'
    },
    methodology: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-200 dark:border-purple-800/30',
      title: 'text-purple-900 dark:text-purple-100',
      titleBg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-900 dark:text-purple-100',
      accent: 'text-purple-600 dark:text-purple-400'
    },
    default: {
      bg: 'bg-slate-50 dark:bg-slate-900/10',
      border: 'border-slate-200 dark:border-slate-800/30',
      title: 'text-slate-900 dark:text-slate-100',
      titleBg: 'bg-slate-100 dark:bg-slate-900/40',
      text: 'text-slate-900 dark:text-slate-100',
      accent: 'text-slate-600 dark:text-slate-400'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`rounded-2xl border-2 p-5 ${styles.bg} ${styles.border} transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className={`flex-shrink-0 p-2 rounded-lg ${styles.titleBg}`}>
              {icon}
            </div>
          )}
          <h4 className={`text-sm font-black uppercase tracking-wider ${styles.title}`}>
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-colors ${
              isCopied
                ? `${styles.titleBg} ${styles.accent}`
                : `hover:${styles.titleBg}`
            }`}
            title="Copiar texto"
          >
            {isCopied ? (
              <Check size={16} className={styles.accent} />
            ) : (
              <Copy size={16} className={`text-slate-400 dark:text-slate-600`} />
            )}
          </button>

          {shouldShowExpand && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg hover:${styles.titleBg} transition-colors`}
              title={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronUp size={16} className={styles.accent} />
              ) : (
                <ChevronDown size={16} className={`text-slate-400 dark:text-slate-600`} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`relative`}>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${styles.text}`}>
          {displayContent}
        </p>

        {/* Fade-out effect para conteúdo recolhido */}
        {shouldShowExpand && !isExpanded && (
          <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${styles.bg} pointer-events-none`} />
        )}
      </div>

      {/* Expand indicator */}
      {shouldShowExpand && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`mt-3 text-xs font-black uppercase tracking-wider ${styles.accent} hover:underline`}
        >
          Ver mais ({lines.length - maxLines} linhas adicionais)
        </button>
      )}
    </div>
  );
}

/**
 * Componente para exibir uma lista de pontos com melhor legibilidade
 */
export function AnalysisPointsList({
  title,
  points,
  type = 'default',
  icon
}: {
  title: string;
  points: string[];
  type?: 'reasoning' | 'evidence' | 'risk' | 'methodology' | 'default';
  icon?: React.ReactNode;
}) {
  const typeStyles = {
    reasoning: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/30',
      title: 'text-blue-900 dark:text-blue-100',
      titleBg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-900 dark:text-blue-100',
      accent: 'text-blue-600 dark:text-blue-400',
      pointBg: 'bg-blue-100 dark:bg-blue-900/40'
    },
    evidence: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800/30',
      title: 'text-emerald-900 dark:text-emerald-100',
      titleBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-900 dark:text-emerald-100',
      accent: 'text-emerald-600 dark:text-emerald-400',
      pointBg: 'bg-emerald-100 dark:bg-emerald-900/40'
    },
    risk: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/30',
      title: 'text-red-900 dark:text-red-100',
      titleBg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-900 dark:text-red-100',
      accent: 'text-red-600 dark:text-red-400',
      pointBg: 'bg-red-100 dark:bg-red-900/40'
    },
    methodology: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-200 dark:border-purple-800/30',
      title: 'text-purple-900 dark:text-purple-100',
      titleBg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-900 dark:text-purple-100',
      accent: 'text-purple-600 dark:text-purple-400',
      pointBg: 'bg-purple-100 dark:bg-purple-900/40'
    },
    default: {
      bg: 'bg-slate-50 dark:bg-slate-900/10',
      border: 'border-slate-200 dark:border-slate-800/30',
      title: 'text-slate-900 dark:text-slate-100',
      titleBg: 'bg-slate-100 dark:bg-slate-900/40',
      text: 'text-slate-900 dark:text-slate-100',
      accent: 'text-slate-600 dark:text-slate-400',
      pointBg: 'bg-slate-100 dark:bg-slate-900/40'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`rounded-2xl border-2 p-5 ${styles.bg} ${styles.border}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className={`flex-shrink-0 p-2 rounded-lg ${styles.titleBg}`}>
            {icon}
          </div>
        )}
        <h4 className={`text-sm font-black uppercase tracking-wider ${styles.title}`}>
          {title}
        </h4>
      </div>

      {/* Points List */}
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.pointBg} flex items-center justify-center mt-0.5`}>
              <span className={`text-xs font-black ${styles.accent}`}>
                {index + 1}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${styles.text}`}>
              {point}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
