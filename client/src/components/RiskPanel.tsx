import React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface RiskPanelProps {
  risks: string[];
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ risks }) => {
  if (!risks || risks.length === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 my-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-green-400 mr-2" />
          <p className="text-sm text-green-700">
            Nenhum risco crítico imediato identificado pela auditoria de IA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4 rounded-r-lg shadow-sm">
      <div className="flex items-center mb-3">
        <ShieldAlert className="h-6 w-6 text-amber-600 mr-2" />
        <h3 className="text-lg font-bold text-amber-900">Matriz de Riscos (Auditoria IA)</h3>
      </div>
      <ul className="space-y-2">
        {risks.map((risk, index) => (
          <li key={index} className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-1 flex-shrink-0" />
            <span className="text-sm text-amber-800 leading-relaxed">{risk}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-amber-200">
        <p className="text-xs text-amber-600 italic">
          * Estes riscos são gerados por análise técnica de viabilidade e não representam juízo de valor político.
        </p>
      </div>
    </div>
  );
};
