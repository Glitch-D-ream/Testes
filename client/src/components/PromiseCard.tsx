import React from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Info,
  Link as LinkIcon,
  Quote,
  HelpCircle
} from 'lucide-react';

interface PromiseCardProps {
  text: string;
  category: string;
  confidence: number;
  negated: boolean;
  conditional: boolean;
  reasoning?: string;
  evidenceSnippet?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export function PromiseCard({
  text,
  category,
  confidence,
  negated,
  conditional,
  reasoning,
  evidenceSnippet,
  sourceName,
  sourceUrl,
}: PromiseCardProps) {
  const isHighConfidence = confidence >= 0.7;
  const isMediumConfidence = confidence >= 0.4;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                {category}
              </span>
              {negated && (
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  Negativa
                </span>
              )}
              {conditional && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  Condicional
                </span>
              )}
            </div>
            <p className="text-slate-900 dark:text-white font-semibold text-lg leading-snug">
              {text}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-black ${
              isHighConfidence ? 'text-emerald-500' : isMediumConfidence ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {(confidence * 100).toFixed(0)}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Confiança IA</p>
          </div>
        </div>

        {/* Snippet de Evidência (A "Prova") */}
        {evidenceSnippet && (
          <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30 relative overflow-hidden">
            <Quote className="absolute -right-2 -bottom-2 text-blue-200/30 dark:text-blue-800/20" size={64} />
            <div className="flex gap-3 relative z-10">
              <div className="mt-1">
                <Quote size={16} className="text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Evidência Textual (Fonte Original)</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "...{evidenceSnippet.length > 250 ? evidenceSnippet.substring(0, 250) + '...' : evidenceSnippet}..."
                </p>
                {sourceName && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Origem:</span>
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                        <LinkIcon size={10} /> {sourceName}
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">{sourceName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {reasoning && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex gap-3">
              <div className="mt-1">
                <Info size={16} className="text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raciocínio da Auditoria</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`px-6 py-3 border-t flex items-center justify-between ${
        isHighConfidence 
          ? 'bg-emerald-50/50 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/20' 
          : isMediumConfidence 
            ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-100 dark:border-amber-900/20' 
            : 'bg-rose-50/50 dark:bg-rose-900/5 border-rose-100 dark:border-rose-900/20'
      }`}>
        <div className="flex items-center gap-2">
          {isHighConfidence ? (
            <TrendingUp size={16} className="text-emerald-500" />
          ) : isMediumConfidence ? (
            <HelpCircle size={16} className="text-amber-500" />
          ) : (
            <TrendingDown size={16} className="text-rose-500" />
          )}
          <span className={`text-xs font-bold ${
            isHighConfidence ? 'text-emerald-600' : isMediumConfidence ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {isHighConfidence ? 'Promessa com alta clareza' : isMediumConfidence ? 'Promessa com termos vagos' : 'Baixa evidência de compromisso'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
          <Target size={12} /> Verificável
        </div>
      </div>
    </div>
  );
}
