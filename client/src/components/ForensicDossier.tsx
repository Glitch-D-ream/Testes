
import React from 'react';
import { FileSearch, MessageSquare, Landmark, AlertCircle, Scale } from 'lucide-react';
import { SourceEndorsement } from './SourceEndorsement';

interface Contradiction {
  topic: string;
  discourse: {
    text: string;
    source: string;
    url: string;
    date: string;
  };
  reality: {
    text: string;
    source: string;
    url: string;
    date: string;
  };
  gapAnalysis: string;
}

interface ForensicDossierProps {
  contradictions: Contradiction[];
}

export const ForensicDossier: React.FC<ForensicDossierProps> = ({ contradictions }) => {
  if (!contradictions || contradictions.length === 0) return null;

  return (
    <div className="space-y-8 mt-12">
      <div className="flex items-center gap-3 border-b-2 border-slate-900 dark:border-white pb-2">
        <Scale className="w-8 h-8" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Dossiê de Contradições (Forense)</h2>
      </div>

      {contradictions.map((item, idx) => (
        <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Lado A: O Discurso */}
          <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-blue-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Discurso Identificado</span>
            </div>
            <p className="text-lg font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
              "{item.discourse.text}"
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{item.discourse.source}</span>
              <SourceEndorsement 
                sourceName={item.discourse.source}
                sourceUrl={item.discourse.url}
                extractionDate={item.discourse.date}
                confidence="high"
                originalText={item.discourse.text}
              />
            </div>
          </div>

          {/* Lado B: A Realidade (Dados Oficiais) */}
          <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="text-emerald-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Fato Oficial Auditado</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed mb-4">
              {item.reality.text}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">{item.reality.source}</span>
              <SourceEndorsement 
                sourceName={item.reality.source}
                sourceUrl={item.reality.url}
                extractionDate={item.reality.date}
                confidence="high"
              />
            </div>
          </div>

          {/* Rodapé: Análise do GAP */}
          <div className="col-span-1 lg:col-span-2 bg-slate-900 p-4 flex items-center gap-4">
            <AlertCircle className="text-amber-400 shrink-0" size={24} />
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Análise Técnica de Inconsistência (GAP)</p>
              <p className="text-sm text-white font-medium leading-snug">
                {item.gapAnalysis}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
