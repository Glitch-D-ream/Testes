import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  BarChart, 
  Calendar,
  User as UserIcon,
  Tag as TagIcon,
  Image as ImageIcon
} from 'lucide-react';
import { ViabilityThermometer } from '../components/ViabilityThermometer';
import { PromiseCard } from '../components/PromiseCard';
import { Button } from '../components/Button';
import { useAnalysis } from '../hooks/useAnalysis';
import { toast } from 'sonner';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, loading, error, data } = useAnalysis();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getById(id).catch(() => {
        toast.error('Não foi possível carregar a análise.');
      });
    }
  }, [id, getById]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/analyze/${id}/pdf`);
      if (!response.ok) throw new Error('Erro ao baixar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analise-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error('Erro ao baixar o relatório PDF');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 font-medium">Processando auditoria profunda...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-bold">Análise não encontrada</h1>
          <p className="text-slate-500">O relatório solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/')} fullWidth>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  const promises = data.promises || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Share2 size={16} />} 
              onClick={handleShare}
            >
              {copied ? 'Copiado' : 'Compartilhar'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={<ImageIcon size={16} />}
              onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}/api/analyze/${id}/image`, '_blank')}
            >
              Card
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<Download size={16} />}
              onClick={handleDownloadPDF}
            >
              PDF
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Header Section */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                  Relatório de Auditoria
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> {new Date(data.createdAt || '').toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-6 leading-tight">
                Análise de Viabilidade: {data.author || 'Autor Não Identificado'}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm text-slate-500 mb-8 border-y border-slate-100 dark:border-slate-800 py-4">
                <div className="flex items-center gap-2">
                  <UserIcon size={16} className="text-blue-500" />
                  <span className="font-medium">{data.author || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TagIcon size={16} className="text-blue-500" />
                  <span className="font-medium">{data.category || 'Geral'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart size={16} className="text-blue-500" />
                  <span className="font-medium">{data.promisesCount} promessas detectadas</span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Info size={20} className="text-blue-600" /> Texto Analisado
                </h3>
                <p className="text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-l-4 border-blue-600">
                  "{data.text}"
                </p>
              </div>
            </section>

            {/* Promises List */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold px-2 flex items-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500" /> 
                Promessas Extraídas e Validadas
              </h2>
              {promises.length > 0 ? (
                promises.map((promise: any, index: number) => (
                  <PromiseCard 
                    key={index} 
                    text={promise.promise_text || promise.text}
                    category={promise.category || 'Geral'}
                    confidence={promise.confidence_score || promise.confidence || 0}
                    negated={promise.negated || false}
                    conditional={promise.conditional || false}
                    reasoning={promise.reasoning}
                  />
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-500">Nenhuma promessa clara foi detectada no texto.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Score Card */}
            <div className="sticky top-24">
              <ViabilityThermometer score={(data.probabilityScore || 0) / 100} />
              
              <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Metodologia Real</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>SICONFI:</strong> Confronto direto com execução orçamentária federal/estadual.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>TSE:</strong> Validação de histórico eleitoral e propostas registradas.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>IA:</strong> Extração semântica de compromissos e intenções.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" fullWidth className="text-xs" onClick={() => navigate('/methodology')}>
                  Ver detalhes técnicos
                </Button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
