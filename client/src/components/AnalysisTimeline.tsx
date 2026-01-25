import { ViabilityBadge } from './ViabilityBadge';

interface TimelineItem {
  id: string;
  date: string;
  author: string;
  category: string;
  viability: number;
  promisesCount: number;
}

interface AnalysisTimelineProps {
  items: TimelineItem[];
  title?: string;
}

export function AnalysisTimeline({ items, title }: AnalysisTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
      {title && (
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
        </div>
      )}

      <div className="relative">
        {items.length > 0 ? (
          <div className="space-y-8">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-6 group">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-white dark:bg-slate-900 border-4 border-blue-600 rounded-full z-10 group-hover:scale-125 transition-transform"></div>
                  {index < items.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-600 to-slate-200 dark:to-slate-800 my-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 transition-all group-hover:border-blue-200 dark:group-hover:border-blue-900/50 group-hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {item.author}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">{formatDate(item.date)}</p>
                      </div>
                      <ViabilityBadge score={item.viability} size="sm" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {item.promisesCount} {item.promisesCount === 1 ? 'PROMESSA' : 'PROMESSAS'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhuma análise disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
