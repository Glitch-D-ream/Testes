import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setError(null);
    setStatus('Iniciando Tríade de Agentes...');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // 1. Solicitar Auto-Análise
      const response = await fetch(`${apiUrl}/api/search/auto-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao iniciar análise');
      }
      
      const { id, status: initialStatus } = await response.json();

      if (initialStatus === 'completed') {
        toast.success('Dossiê encontrado no cache!');
        navigate(`/analysis/${id}`);
        return;
      }

      // 2. Polling de Status
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        try {
          const statusRes = await fetch(`${apiUrl}/api/search/status/${id}`).catch(() => null);
          if (!statusRes || !statusRes.ok) {
            console.warn('Falha na rede ao verificar status, tentando novamente...');
            if (pollCount > 40) { // ~2 minutos
              clearInterval(pollInterval);
              setIsProcessing(false);
              setError('Falha de conexão persistente com o servidor.');
            }
            return;
          }
          
          const data = await statusRes.json();

          if (data.status === 'completed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.success('Análise concluída com sucesso!');
            navigate(`/analysis/${id}`);
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            const msg = data.error_message || 'Os agentes não conseguiram extrair promessas suficientes para este político.';
            setError(msg);
            toast.error('A análise falhou');
          } else {
            // Atualizar status baseado no tempo decorrido
            if (pollCount < 5) setStatus('Iniciando varredura na web...');
            else if (pollCount < 15) setStatus('Cruzando dados orçamentários (SICONFI)...');
            else if (pollCount < 30) setStatus('Finalizando auditoria técnica com IA...');
            else setStatus('Aguardando resposta final dos agentes...');
          }
        } catch (err) {
          console.error('Erro no polling:', err);
        }
      }, 3000);

      // Limite de segurança: 5 minutos para o polling (análises profundas de IA podem demorar)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          setError('A análise está demorando mais que o esperado devido à profundidade da auditoria. Por favor, verifique o histórico em alguns instantes.');
        }
      }, 300000);

    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao conectar com os agentes.');
      setIsProcessing(false);
      setError(error.message || 'Erro de conexão.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
          placeholder="Digite o nome de um político (ex: Tarcísio de Freitas)..."
          className="w-full px-6 py-4 text-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all shadow-lg group-hover:shadow-xl disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isProcessing}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-slate-400"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-rose-700 dark:text-rose-400">
            <p className="font-bold">Não foi possível completar a análise</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isProcessing && !error && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl animate-pulse">
          <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-medium">{status}</span>
          </div>
          <div className="mt-3 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="mt-2 text-xs text-blue-600/70 dark:text-blue-400/70 text-center">
            Isso pode levar até 40 segundos. Nossos agentes estão trabalhando para garantir precisão técnica.
          </p>
        </div>
      )}
    </div>
  );
}
