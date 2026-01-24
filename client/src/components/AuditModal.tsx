import React, { useState } from 'react';
import { X, Flag, Link as LinkIcon, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuditModalProps {
  promiseId: string;
  promiseText: string;
  onClose: () => void;
}

export default function AuditModal({ promiseId, promiseText, onClose }: AuditModalProps) {
  const [type, setType] = useState<'report_error' | 'suggest_source'>('suggest_source');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/audit/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promiseId,
          type,
          suggestedUrl: url,
          description
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar contribuição');

      toast.success('Obrigado! Sua contribuição foi enviada para auditoria.');
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Falha ao enviar contribuição. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flag size={20} className="text-blue-600" /> Auditoria Cidadã
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Promessa Analisada</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{promiseText}"</p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setType('suggest_source')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'suggest_source' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              Sugerir Fonte
            </button>
            <button
              type="button"
              onClick={() => setType('report_error')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'report_error' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600' : 'text-slate-500'
              }`}
            >
              Reportar Erro
            </button>
          </div>

          <div className="space-y-4">
            {type === 'suggest_source' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <LinkIcon size={12} /> Link da Fonte (Obrigatório)
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://g1.globo.com/..."
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Observações Adicionais
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'suggest_source' ? "Explique por que esta fonte é relevante..." : "Explique o erro encontrado..."}
                className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-all text-sm min-h-[100px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {isSubmitting ? 'Enviando...' : 'Enviar Contribuição'}
          </button>
        </form>
      </div>
    </div>
  );
}
