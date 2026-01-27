
import React from 'react';
import { Info, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"; // Assumindo que existe ou criaremos um wrapper simples

interface SourceEndorsementProps {
  sourceName: string;
  sourceUrl?: string;
  extractionDate: string;
  confidence: 'high' | 'medium' | 'low';
  originalText?: string;
}

export const SourceEndorsement: React.FC<SourceEndorsementProps> = ({
  sourceName,
  sourceUrl,
  extractionDate,
  confidence,
  originalText
}) => {
  const confidenceColors = {
    high: 'text-emerald-500',
    medium: 'text-amber-500',
    low: 'text-slate-400'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center ml-1 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Info size={14} className="text-blue-500 cursor-help" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={confidenceColors[confidence]} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fonte Auditada</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{extractionDate}</span>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{sourceName}</p>
              {originalText && (
                <blockquote className="text-[11px] text-slate-600 dark:text-slate-400 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2 py-1 mb-2">
                  "{originalText.length > 150 ? originalText.substring(0, 150) + '...' : originalText}"
                </blockquote>
              )}
            </div>

            {sourceUrl && (
              <a 
                href={sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
              >
                Verificar Origem <ExternalLink size={10} />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
