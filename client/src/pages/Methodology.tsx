import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Methodology() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Metodologia Aberta</h1>
          <p className="text-slate-600 mt-1">Documentação completa e auditável</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          {/* Introdução */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Introdução</h2>
            <p className="text-slate-700 leading-relaxed">
              O Detector de Promessa Vazia é um sistema completamente independente e transparente de análise de viabilidade de promessas políticas. Esta documentação descreve todos os processos, critérios e fontes de dados utilizados.
            </p>
          </section>

          {/* Princípios */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Princípios Fundamentais</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-900">Transparência Total</h3>
                <p className="text-slate-700">Todos os critérios, dados e cálculos são públicos e auditáveis</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-900">Análise Probabilística</h3>
                <p className="text-slate-700">Resultados são expressos como probabilidades, nunca como acusações</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-900">Independência</h3>
                <p className="text-slate-700">Sem afiliações políticas, comerciais ou de qualquer outra natureza</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-slate-900">Direito de Resposta</h3>
                <p className="text-slate-700">Qualquer pessoa pode solicitar revisão ou contestação de uma análise</p>
              </div>
            </div>
          </section>

          {/* Processamento de Linguagem Natural */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Processamento de Linguagem Natural (PLN)</h2>
            <div className="space-y-4">
              <p className="text-slate-700">
                O sistema utiliza técnicas de PLN para extrair promessas de textos em português. O processo funciona em três etapas:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900">1. Segmentação</h4>
                  <p className="text-slate-700 text-sm">O texto é dividido em sentenças individuais</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">2. Detecção de Promessas</h4>
                  <p className="text-slate-700 text-sm">Cada sentença é analisada para identificar verbos e padrões que indicam promessas (ex: "vou", "prometo", "construirei")</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">3. Extração de Entidades</h4>
                  <p className="text-slate-700 text-sm">Números, datas, nomes e categorias são extraídos da promessa</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cálculo de Probabilidade */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cálculo de Probabilidade</h2>
            <p className="text-slate-700 mb-4">
              A probabilidade de cumprimento é calculada agregando cinco fatores principais:
            </p>
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Especificidade da Promessa (25%)</h4>
                <p className="text-slate-700 text-sm">Promessas com números, prazos e metas claras têm maior probabilidade de serem verificáveis e cumpríveis</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Conformidade Histórica (25%)</h4>
                <p className="text-slate-700 text-sm">Taxa histórica de cumprimento de promessas similares em categorias equivalentes</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Viabilidade Orçamentária (20%)</h4>
                <p className="text-slate-700 text-sm">Análise de disponibilidade de recursos baseada em dados orçamentários públicos</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Realismo do Prazo (15%)</h4>
                <p className="text-slate-700 text-sm">Avaliação se o prazo proposto é realista para a execução da promessa</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Histórico do Autor (15%)</h4>
                <p className="text-slate-700 text-sm">Taxa histórica de cumprimento de promessas anteriores do autor</p>
              </div>
            </div>
          </section>

          {/* Fontes de Dados */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Fontes de Dados</h2>
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">SICONFI (Tesouro Nacional)</h4>
                <p className="text-slate-700 text-sm">Dados de execução orçamentária e contas anuais de entes públicos</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Portal da Transparência</h4>
                <p className="text-slate-700 text-sm">Gastos públicos, servidores e convênios do governo federal</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">TSE (Tribunal Superior Eleitoral)</h4>
                <p className="text-slate-700 text-sm">Dados de candidatos, propostas de governo e histórico eleitoral</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900">Dados Históricos</h4>
                <p className="text-slate-700 text-sm">Base de dados de promessas anteriores e seu status de cumprimento</p>
              </div>
            </div>
          </section>

          {/* Limitações */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Limitações</h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>O sistema não pode avaliar promessas muito vagas ou qualitativas</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Dados históricos podem estar incompletos ou desatualizados</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Fatores externos (crises, mudanças políticas) não são considerados</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>A análise é baseada em padrões históricos, não em predição do futuro</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer Final */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <p className="text-sm text-yellow-700">
              <strong>Aviso Legal:</strong> Esta metodologia é fornecida para fins informativos e educacionais. O sistema não é responsável por decisões tomadas com base em seus resultados. Qualquer pessoa mencionada tem direito a solicitar revisão ou contestação de uma análise.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
