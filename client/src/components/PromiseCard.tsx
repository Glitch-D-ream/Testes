import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface PromiseCardProps {
  text: string;
  category: string;
  confidence: number;
  negated: boolean;
  conditional: boolean;
  reasoning?: string;
}

export function PromiseCard({
  text,
  category,
  confidence,
  negated,
  conditional,
  reasoning,
}: PromiseCardProps) {
  const confidenceColor =
    confidence >= 0.8 ? 'text-green-600' : confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600';
  const confidenceBg =
    confidence >= 0.8 ? 'bg-green-50' : confidence >= 0.5 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className={`${confidenceBg} rounded-lg border border-gray-200 p-6 mb-4`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-gray-900 font-medium text-lg mb-2">{text}</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              {category}
            </span>
            {negated && (
              <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                Negada
              </span>
            )}
            {conditional && (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                Condicional
              </span>
            )}
          </div>
        </div>

        <div className="ml-4 text-right">
          <div className={`text-3xl font-bold ${confidenceColor}`}>
            {(confidence * 100).toFixed(0)}%
          </div>
          <p className="text-sm text-gray-600">Confiança</p>
        </div>
      </div>

      {reasoning && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Análise da IA:</p>
              <p className="text-sm text-gray-700 mt-1">{reasoning}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {confidence >= 0.7 ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Promessa clara e verificável</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-600 font-medium">Promessa ambígua ou condicional</span>
          </>
        )}
      </div>
    </div>
  );
}
