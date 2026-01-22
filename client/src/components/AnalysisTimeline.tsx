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
    <div className="bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>}

      <div className="relative">
        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  {index < items.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.author}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                      </div>
                      <ViabilityBadge score={item.viability} size="sm" />
                    </div>

                    <div className="flex gap-2 mt-3">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {item.promisesCount} promessa{item.promisesCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma análise disponível</p>
        )}
      </div>
    </div>
  );
}
