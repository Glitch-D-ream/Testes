import React, { useEffect, useRef } from 'react';
import { Radar, AlertCircle } from 'lucide-react';

interface ViabilityDimension {
  name: string;
  value: number; // 0-100
  description: string;
}

interface ViabilityRadarProps {
  dimensions: ViabilityDimension[];
  overallScore: number;
}

export const ViabilityRadar: React.FC<ViabilityRadarProps> = ({
  dimensions,
  overallScore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || dimensions.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;
    const numDimensions = dimensions.length;
    const angleSlice = (2 * Math.PI) / numDimensions;

    // Limpar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar grid de fundo (círculos concêntricos)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const radius = (maxRadius / 5) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Desenhar eixos
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i < numDimensions; i++) {
      const angle = angleSlice * i - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Desenhar polígono de dados
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    dimensions.forEach((dimension, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const radius = (maxRadius / 100) * dimension.value;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Desenhar pontos nos vértices
    ctx.fillStyle = '#3b82f6';
    dimensions.forEach((dimension, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const radius = (maxRadius / 100) * dimension.value;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Desenhar rótulos
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    dimensions.forEach((dimension, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = maxRadius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);

      ctx.fillText(dimension.name, x, y);
    });

    // Desenhar valores no centro
    ctx.font = 'bold 24px Inter';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(overallScore.toFixed(0) + '%', centerX, centerY - 10);

    ctx.font = '12px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Viabilidade Geral', centerX, centerY + 15);
  }, [dimensions, overallScore]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <Radar className="text-indigo-600" size={24} />
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Análise Multidimensional
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Viabilidade em diferentes eixos de implementação
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="max-w-full"
        />
      </div>

      {/* Dimensões */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 max-h-40 overflow-y-auto">
        <div className="space-y-2">
          {dimensions.map((dim) => (
            <div key={dim.name} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 dark:text-white text-sm">
                    {dim.name}
                  </span>
                  <span className="text-xs font-bold text-blue-600">{dim.value}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {dim.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViabilityRadar;
