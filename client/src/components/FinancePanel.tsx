
import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, FileText, Landmark } from 'lucide-react';

interface FinancePanelProps {
  evidences: Array<{
    type: 'EXPENSE' | 'PROPOSAL' | 'VOTING';
    description: string;
    value?: number;
    date: string;
    source: string;
    link?: string;
  }>;
}

export const FinancePanel: React.FC<FinancePanelProps> = ({ evidences }) => {
  if (!evidences || evidences.length === 0) return null;

  const expenses = evidences.filter(e => e.type === 'EXPENSE');
  const totalValue = expenses.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Rastreabilidade Financeira</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Execução Orçamentária e Emendas</p>
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Total Rastreado</p>
          <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {evidences.map((evidence, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                evidence.type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {evidence.type === 'EXPENSE' ? <ArrowDownRight size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{evidence.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{evidence.source}</span>
                  <span className="text-[10px] text-slate-400">{new Date(evidence.date).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            {evidence.value && (
              <div className="text-right">
                <p className={`font-bold ${evidence.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'}`}>
                  R$ {evidence.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                {evidence.link && (
                  <a href={evidence.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">
                    Ver Documento
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
