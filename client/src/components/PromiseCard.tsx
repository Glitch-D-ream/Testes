import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Info,
  Link as LinkIcon,
  Quote,
  HelpCircle,
  Flag,
  Scale,
  ExternalLink
} from 'lucide-react';
import AuditModal from './AuditModal';

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
  legislativeIncoherence?: string;
  legislativeSourceUrl?: string;
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
  legislativeIncoherence,
  legislativeSourceUrl,
  id, // Adicionado ID para auditoria
}: PromiseCardProps & { id?: string }) {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const isHighConfidence = confidence >= 0.7;
  const isMediumConfidence = confidence >= 0.4;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
      {isAuditModalOpen && id && (
        <AuditModal 
          promiseId={id} 
          promiseText={text} 
          onClose={() => setIsAuditModalOpen(false)} 
        />
      )}
      <div className="p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                {category}
              </span>
              {negated && (
                <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-800">
                  Negativa
                </span>
              )}
              {conditional && (
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100 dark:border-amber-800">
                  Condicional
                </span>
              )}
            </div>
            <p className="text-slate-900 dark:text-white font-bold text-xl leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
              {text}
            </p>
          </div>

          <div className="text-right flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className={`text-3xl font-black tracking-tighter ${
              isHighConfidence ? 'text-emerald-500' : isMediumConfidence ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {(confidence * 100).toFixed(0)}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Confiança</p>
          </div>
        </div>

        {/* Snippet de Evidência (A "Prova") */}
        {evidenceSnippet && (
          <div className="mt-6 p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 relative overflow-hidden">
            <Quote className="absolute -right-4 -bottom-4 text-blue-200/20 dark:text-blue-800/10" size={80} />
            <div className="flex gap-4 relative z-10">
              <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Quote size={14} className="text-blue-500" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Evidência Textual Identificada</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed font-medium">
                  "...{evidenceSnippet.length > 250 ? evidenceSnippet.substring(0, 250) + '...' : evidenceSnippet}..."
                </p>
                {sourceName && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-100/50 dark:border-blue-800/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fonte:</span>
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                        <LinkIcon size={10} /> {sourceName} <ExternalLink size={8} />
                      </a>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500">{sourceName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {reasoning && (
          <div className="mt-4 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise Técnica</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Incoerência Legislativa (Diz vs Faz) */}
        {legislativeIncoherence && (
          <div className="mt-4 p-5 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl shadow-sm">
                <Scale size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">
                    Incoerência Detectada
                  </h4>
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black rounded-full">DADOS OFICIAIS</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                  {legislativeIncoherence}
                </p>
                {legislativeSourceUrl && (
                  <a 
                    href={legislativeSourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-rose-600 dark:text-rose-400 hover:underline group/link"
                  >
                    Ver votação na Câmara dos Deputados 
                    <ExternalLink size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`px-8 py-4 border-t flex items-center justify-between transition-colors ${
        isHighConfidence 
          ? 'bg-emerald-50/30 dark:bg-emerald-900/5 border-emerald-100 dark:border-emerald-900/20' 
          : isMediumConfidence 
            ? 'bg-amber-50/30 dark:bg-amber-900/5 border-amber-100 dark:border-amber-900/20' 
            : 'bg-rose-50/30 dark:bg-rose-900/5 border-rose-100 dark:border-rose-900/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-full ${
            isHighConfidence ? 'bg-emerald-100 text-emerald-600' : isMediumConfidence ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {isHighConfidence ? (
              <TrendingUp size={14} />
            ) : isMediumConfidence ? (
              <HelpCircle size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
          </div>
          <span className={`text-xs font-black uppercase tracking-wider ${
            isHighConfidence ? 'text-emerald-700 dark:text-emerald-400' : isMediumConfidence ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {isHighConfidence ? 'Alta Clareza' : isMediumConfidence ? 'Termos Vagos' : 'Baixa Evidência'}
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
          >
            <Flag size={14} /> Contestar
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Target size={14} /> Verificável
          </div>
        </div>
      </div>
    </div>
  );
}
