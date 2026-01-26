import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Database, 
  Cpu, 
  ShieldCheck, 
  BarChart, 
  Code2,
  FileSearch,
  CheckCircle2
} from 'lucide-react';

export default function Methodology() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} /> Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            <span className="font-bold text-lg">Metodologia Aberta</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-12">
        {/* Intro */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-black mb-6 tracking-tight">Como auditamos a política?</h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            O **Seth VII** utiliza um motor de auditoria digital que combina Inteligência Artificial e cruzamento massivo de dados públicos reais.
          </p>
        </div>

        <div className="space-y-12">
          {/* Pillar 1: IA & NLP */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                <Cpu size={24} />
              </div>
              <h2 className="text-2xl font-bold">Extração Semântica (IA)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Utilizamos modelos de linguagem avançados (Gemini 1.5 Flash e Llama 3) para processar discursos e identificar compromissos específicos. A IA não apenas "lê" o texto, mas classifica cada sentença em:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-600"><CheckCircle2 size={16}/> Verbos de Ação</h4>
                <p className="text-sm text-slate-500">Identificação de verbos no futuro ou presente do indicativo que denotam compromisso real.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-600"><CheckCircle2 size={16}/> Especificidade</h4>
                <p className="text-sm text-slate-500">Detecção de números, prazos, locais e metas quantificáveis.</p>
              </div>
            </div>
          </section>

          {/* Pillar 2: Dados Reais */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <h2 className="text-2xl font-bold">Cruzamento de Dados Reais</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Diferente de outros sistemas, nós não usamos dados simulados. Nossa auditoria confronta a promessa com:
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                  <BarChart size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">SICONFI (Tesouro Nacional)</h4>
                  <p className="text-slate-500">Analisamos a <strong>execução orçamentária histórica</strong> da categoria da promessa. Se um político promete construir hospitais em uma região onde a execução orçamentária de saúde é cronicamente baixa, o score de viabilidade cai.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                  <FileSearch size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">TSE & Dados Eleitorais</h4>
                  <p className="text-slate-500">Verificamos o <strong>histórico de mandatos</strong> e as propostas registradas oficialmente. Confrontamos se o que está sendo dito agora condiz com o que foi registrado no plano de governo oficial.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                  <Code2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Histórico de Votação (API da Câmara)</h4>
                  <p className="text-slate-500">Verificamos se o parlamentar já votou <strong>contra</strong> medidas que agora ele promete apoiar. A inconsistência política é um fator primário no cálculo do veredito.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Pillar 3: Score Algorithm */}
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-2xl font-bold">Cálculo da Probabilidade</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-black mb-1">25%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Especificidade</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">30%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Orçamento Real</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">25%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Votações</div>
              </div>
              <div>
                <div className="text-3xl font-black mb-1">20%</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Histórico</div>
              </div>
            </div>
            <div className="mt-10 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-sm leading-relaxed italic opacity-90">
                "Nosso objetivo não é prever o futuro, mas sim medir quão sólida é a base técnica e política de uma promessa no momento em que ela é feita."
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-slate-400" /> Limitações e Ética
            </h3>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span>O sistema não analisa promessas subjetivas (ex: "vou trazer felicidade").</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span>Dependemos da disponibilidade das APIs governamentais (SICONFI/Câmara).</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">•</span>
                <span>A análise é automatizada e deve ser usada como ferramenta de apoio ao cidadão, não como verdade absoluta.</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
