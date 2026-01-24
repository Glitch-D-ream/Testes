import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function LegalDisclaimer() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-4 text-slate-400">
        <ShieldAlert size={20} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Aviso Legal</h3>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed">
        <p>
          <strong>Análise Probabilística:</strong> Este sistema fornece uma análise baseada em dados históricos, orçamentários e padrões linguísticos oficiais. Não constitui um juízo de valor definitivo sobre o autor.
        </p>
        <p>
          <strong>Transparência:</strong> Todos os critérios e fontes de dados (SICONFI, TSE, Portal da Transparência) são públicos e auditáveis através da nossa metodologia.
        </p>
        <p>
          <strong>Responsabilidade:</strong> Este sistema é uma ferramenta informativa de auditoria cidadã. O uso dos resultados é de inteira responsabilidade do usuário.
        </p>
      </div>
    </div>
  );
}
