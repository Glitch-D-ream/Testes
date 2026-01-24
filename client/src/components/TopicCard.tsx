import React, { useState } from 'react';
import { 
  ChevronRight, 
  Stethoscope, 
  GraduationCap, 
  Hammer, 
  Shield, 
  Coins, 
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { PromiseCard } from './PromiseCard';

interface TopicCardProps {
  category: string;
  promises: any[];
}

const categoryIcons: Record<string, any> = {
  'Saúde': Stethoscope,
  'Educação': GraduationCap,
  'Infraestrutura': Hammer,
  'Segurança': Shield,
  'Economia': Coins,
  'Trabalho': Briefcase,
  'Geral': HelpCircle,
};

export default function TopicCard({ category, promises }: TopicCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = categoryIcons[category] || HelpCircle;

  // Calcular score médio do tópico
  const avgScore = promises.reduce((acc, p) => acc + (p.confidence_score || 0), 0) / promises.length;

  return (
    <div className="mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Icon size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{category}</h3>
            <p className="text-sm text-slate-500">{promises.length} {promises.length === 1 ? 'promessa identificada' : 'promessas identificadas'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className={`text-lg font-black ${avgScore >= 0.7 ? 'text-emerald-500' : avgScore >= 0.4 ? 'text-amber-500' : 'text-rose-500'}`}>
              {(avgScore * 100).toFixed(0)}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Clareza Média</p>
          </div>
          <ChevronRight className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />
          {promises.map((promise, idx) => (
            <div key={promise.id || idx} className="relative">
              {promise.news_title && (
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Contexto: {promise.news_title}
                </div>
              )}
              <PromiseCard
                id={promise.id}
                text={promise.promise_text || promise.text}
                category={promise.category || category}
                confidence={promise.confidence_score || promise.confidence || 0}
                negated={promise.negated || false}
                conditional={promise.conditional || false}
                reasoning={promise.reasoning}
                evidenceSnippet={promise.evidence_snippet}
                sourceName={promise.source_name}
                sourceUrl={promise.source_url}
                legislativeIncoherence={promise.legislative_incoherence}
                legislativeSourceUrl={promise.legislative_source_url}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
