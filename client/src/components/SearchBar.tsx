
import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Zap } from 'lucide-react';
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
    setStatus('Iniciando Rede de Agentes...');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
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
        toast.success('Dossiê recuperado do cofre!');
        navigate(`/analysis/${id}`);
        return;
      }

      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        try {
          const statusRes = await fetch(`${apiUrl}/api/search/status/${id}`).catch(() => null);
          
          // Se o servidor demorar ou falhar, não paramos imediatamente, mas aumentamos o rigor
          if (!statusRes || !statusRes.ok) {
            if (pollCount > 60) { // Aumentado para 3 minutos de tolerância
              clearInterval(pollInterval);
              setIsProcessing(false);
              setError('O servidor está processando uma carga alta. Verifique o histórico em instantes.');
            }
            return;
          }
          
          const data = await statusRes.json();

          if (data.status === 'completed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast.success('Auditoria finalizada!');
            navigate(`/analysis/${id}`);
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setError(data.error_message || 'O motor de auditoria encontrou inconsistências fatais nos dados.');
          } else if (data.status === 'processing') {
            // Atualização dinâmica de status baseada no tempo real
            if (pollCount < 10) setStatus('Scout: Minerando web e portais oficiais...');
            else if (pollCount < 25) setStatus('Ironclad: Validando orçamentos e emendas...');
            else if (pollCount < 45) setStatus('Brain: Correlacionando fatos e discursos...');
            else setStatus('Finalizando dossiê forense (IA Raciocínio Profundo)...');
          }
        } catch (err) {
          console.error('Erro no polling:', err);
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setIsProcessing(false);
          setError('Tempo limite excedido. Verifique o histórico em instantes.');
        }
      }, 300000);

    } catch (error: any) {
      toast.error(error.message || 'Erro de conexão.');
      setIsProcessing(false);
      setError(error.message || 'Erro ao conectar.');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative flex items-center w-full group">
        <div className="absolute left-6 text-slate-500 group-focus-within:text-blue-500 transition-colors">
          <Search size={20} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
          placeholder="Digite o nome de um político (ex: Arthur Lira)..."
          className="w-full bg-transparent border-none py-6 pl-16 pr-40 text-lg md:text-xl font-medium text-white placeholder:text-slate-600 focus:ring-0 outline-none disabled:opacity-50"
        />

        <div className="absolute right-3">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Zap size={16} className="fill-current" /> Audit
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-rose-200">
            <p className="font-bold uppercase tracking-wider text-[10px]">Falha na Auditoria</p>
            <p className="opacity-80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {isProcessing && !error && (
        <div className="mt-6 p-6 glass rounded-3xl neon-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-blue-400">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{status}</span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase">Processando Agentes</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">
            Aguarde. Nossos agentes estão minerando documentos e portais oficiais.
          </p>
        </div>
      )}
    </div>
  );
}
