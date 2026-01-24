import React from 'react';

interface ViabilityThermometerProps {
  score: number;
}

export function ViabilityThermometer({ score }: ViabilityThermometerProps) {
  const percentage = Math.round(score * 100);
  
  const getColors = (s: number) => {
    if (s >= 0.8) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
    if (s >= 0.6) return { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
    if (s >= 0.4) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' };
    if (s >= 0.2) return { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' };
    return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' };
  };

  const colors = getColors(score);

  return (
    <div className={`w-full ${colors.bg} rounded-xl p-6 border border-opacity-50 border-gray-200`}>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Termômetro de Viabilidade</h4>
          <p className={`text-4xl font-black ${colors.text}`}>{percentage}%</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${colors.bar} text-white`}>
            {percentage >= 80 ? 'Altamente Viável' : 
             percentage >= 60 ? 'Viável' : 
             percentage >= 40 ? 'Moderada' : 
             percentage >= 20 ? 'Baixa' : 'Muito Baixa'}
          </span>
        </div>
      </div>
      
      <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`absolute top-0 left-0 h-full ${colors.bar} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute top-0 right-0 h-full w-8 bg-white opacity-20 transform skew-x-12"></div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        <span>Crítico</span>
        <span>Alerta</span>
        <span>Neutro</span>
        <span>Seguro</span>
        <span>Ideal</span>
      </div>
    </div>
  );
}
