
import React from 'react';
import { BarChart3, Users, Trophy, Target, Info } from 'lucide-react';

interface BenchmarkingPanelProps {
  benchmark: {
    politicianName: string;
    comparisonGroup: string;
    metrics: {
      budgetAlignment: number;
      partyLoyalty: number;
      productivityScore: number;
      consistencyScore: number;
    };
    groupAverages: {
      budgetAlignment: number;
      partyLoyalty: number;
      productivityScore: number;
      consistencyScore: number;
    };
    uniqueness: string;
    rankingInGroup: number;
    totalInGroup: number;
  };
}

export const BenchmarkingPanel: React.FC<BenchmarkingPanelProps> = ({ benchmark }) => {
  if (!benchmark) return null;

  const MetricBar = ({ label, value, average, color }: { label: string, value: number, average: number, color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span>{value.toFixed(1)}% <span className="text-slate-400 font-normal">(Média: {average.toFixed(1)}%)</span></span>
      </div>
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        {/* Média do Grupo (Linha Vertical) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" 
          style={{ left: `${average}%` }}
          title={`Média do Grupo: ${average}%`}
        />
        {/* Valor do Político */}
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Benchmarking Comparativo</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grupo: {benchmark.comparisonGroup}</p>
          </div>
        </div>
        {benchmark.rankingInGroup > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-blue-600" />
            <div className="text-right">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Ranking</p>
              <p className="text-xl font-black text-blue-900 dark:text-blue-100">{benchmark.rankingInGroup}º <span className="text-xs font-normal text-blue-400">de {benchmark.totalInGroup}</span></p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <MetricBar 
            label="Alinhamento Orçamentário" 
            value={benchmark.metrics.budgetAlignment} 
            average={benchmark.groupAverages.budgetAlignment}
            color="bg-emerald-500"
          />
          <MetricBar 
            label="Fidelidade Partidária" 
            value={benchmark.metrics.partyLoyalty} 
            average={benchmark.groupAverages.partyLoyalty}
            color="bg-blue-500"
          />
        </div>
        <div className="space-y-6">
          <MetricBar 
            label="Score de Produtividade" 
            value={benchmark.metrics.productivityScore} 
            average={benchmark.groupAverages.productivityScore}
            color="bg-indigo-500"
          />
          <MetricBar 
            label="Consistência de Discurso" 
            value={benchmark.metrics.consistencyScore} 
            average={benchmark.groupAverages.consistencyScore}
            color="bg-purple-500"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Diferencial Competitivo (Unicidade)</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{benchmark.uniqueness}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 italic">
        <Info size={12} />
        * Comparações baseadas em dados reais do SICONFI, Câmara dos Deputados e histórico de análises do Seth VII.
      </div>
    </div>
  );
};
