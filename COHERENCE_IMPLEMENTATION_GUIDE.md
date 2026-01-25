# Guia de Implementação: Análise de Coerência Legislativa

**Versão:** 1.0  
**Data:** 24 de Janeiro de 2026  
**Autor:** Seth VII

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes Implementados](#componentes-implementados)
4. [Fluxo de Integração](#fluxo-de-integração)
5. [Guia de Implementação](#guia-de-implementação)
6. [Melhorias de Legibilidade](#melhorias-de-legibilidade)
7. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

A análise de coerência legislativa é um novo módulo que detecta incoerências entre as promessas políticas (discurso) e as ações legislativas (votos/vetos) de um político. Este sistema resolve o problema central identificado: **a população leiga não consegue conectar promessas com ações legislativas reais**.

### Problema Resolvido

Um político pode prometer "ajudar a população com IA" mas votar CONTRA proposições que beneficiariam a população a longo prazo. A população não consegue ver essa contradição porque:

- As promessas são feitas em discursos e redes sociais
- Os votos estão em bases de dados legislativas
- Não há conexão visual entre os dois

### Solução Implementada

O novo módulo:

1. **Extrai promessas** do texto (já existente)
2. **Busca votações do político** na Câmara dos Deputados
3. **Analisa se há contradição** entre promessa e voto
4. **Apresenta incoerências** de forma clara e visual
5. **Calcula um score de coerência** (0-100%)

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
Texto com Promessas
        ↓
[Extração de Promessas] (PLN + IA)
        ↓
[Análise de Coerência]
    ├→ Buscar ID do Político (Câmara API)
    ├→ Buscar Votações Recentes
    ├→ Comparar Tema da Promessa com Tema do Voto
    ├→ Detectar Contradições
    └→ Calcular Score de Coerência
        ↓
[Salvar Relatório] (Supabase)
        ↓
[Exibir no Frontend]
    ├→ CoherenceAnalysisPanel (Score Visual)
    ├→ Incoherences Expandíveis
    └→ Links para Votações Oficiais
```

### Componentes do Backend

| Arquivo | Responsabilidade |
| :--- | :--- |
| `server/modules/coherence-analyzer.ts` | Lógica principal de análise de coerência |
| `server/services/coherence.service.ts` | Serviço para integrar análise no fluxo |
| `server/integrations/camara.ts` | Integração com API da Câmara (já existente) |

### Componentes do Frontend

| Arquivo | Responsabilidade |
| :--- | :--- |
| `client/src/components/CoherenceAnalysisPanel.tsx` | Painel principal com score e incoerências |
| `client/src/components/AnalysisTextBlock.tsx` | Componente reutilizável para blocos de texto |

---

## 🔧 Componentes Implementados

### 1. Módulo de Análise de Coerência (`coherence-analyzer.ts`)

**Funções Principais:**

```typescript
// Analisa a coerência entre uma promessa e o histórico legislativo
analyzeCoherence(
  promise: ExtractedPromise,
  politicianName: string,
  promiseId: string
): Promise<IncoherenceReport>

// Gera um resumo textual do relatório
generateCoherenceSummary(report: IncoherenceReport): string
```

**Tipos de Incoerência Detectados:**

- `DIRECT_CONTRADICTION`: Contradição direta (ex: prometeu apoiar, votou contra)
- `THEMATIC_CONTRADICTION`: Contradição temática (ex: prometeu educação, votou contra educação)
- `PARTIAL_CONTRADICTION`: Contradição parcial (ex: contexto similar, mas não idêntico)

**Severidade:**

- `HIGH`: Contradição direta e clara
- `MEDIUM`: Contradição temática relacionada
- `LOW`: Contradição parcial ou indireta

### 2. Serviço de Coerência (`coherence.service.ts`)

**Funções Principais:**

```typescript
// Analisa coerência de todas as promessas
analyzePromisesCoherence(
  analysisId: string,
  promises: ExtractedPromise[],
  politicianName: string
): Promise<IncoherenceReport[]>

// Recupera relatórios de coerência
getAnalysisCoherenceReports(analysisId: string): Promise<any[]>

// Calcula score médio de coerência
getAnalysisAverageCoherence(analysisId: string): Promise<number>
```

### 3. Painel de Análise de Coerência (Frontend)

**Características:**

- ✅ Score visual com barra de progresso
- ✅ Contagem de incoerências por severidade
- ✅ Incoerências expandíveis com detalhes
- ✅ Links diretos para votações na Câmara
- ✅ Resumo textual automático
- ✅ Design responsivo e acessível

### 4. Componente de Bloco de Texto Melhorado

**Características:**

- ✅ Formatação clara e estruturada
- ✅ Expansão/colapso para textos longos
- ✅ Cópia para área de transferência
- ✅ Diferentes estilos por tipo (reasoning, evidence, risk, etc)
- ✅ Listas numeradas com melhor legibilidade

---

## 🔄 Fluxo de Integração

### Passo 1: Integrar no Serviço de Análise

Modificar `server/services/analysis.service.ts`:

```typescript
import { coherenceService } from './coherence.service.ts';

export class AnalysisService {
  async createAnalysis(userId: string | null, text: string, author: string, category: string) {
    // ... código existente ...

    // NOVO: Analisar coerência das promessas
    if (promises.length > 0 && author && author !== 'Autor Desconhecido') {
      const coherenceReports = await coherenceService.analyzePromisesCoherence(
        analysisId,
        promises,
        author
      );
      
      // Calcular score médio de coerência
      const averageCoherence = await coherenceService.getAnalysisAverageCoherence(analysisId);
      
      return {
        id: analysisId,
        probabilityScore,
        promisesCount: promises.length,
        promises,
        coherenceScore: averageCoherence,  // NOVO
        coherenceReports,                   // NOVO
      };
    }

    return {
      id: analysisId,
      probabilityScore,
      promisesCount: promises.length,
      promises,
    };
  }
}
```

### Passo 2: Atualizar Schema do Supabase

Adicionar tabela para armazenar relatórios de coerência:

```sql
CREATE TABLE promise_coherence (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES analyses(id),
  promise_id TEXT NOT NULL,
  coherence_score INTEGER NOT NULL,
  incoherences_count INTEGER NOT NULL,
  incoherences_data JSONB,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id)
);

CREATE INDEX idx_promise_coherence_analysis ON promise_coherence(analysis_id);
CREATE INDEX idx_promise_coherence_promise ON promise_coherence(promise_id);
```

### Passo 3: Integrar Componentes no Frontend

Modificar `client/src/pages/Analysis.tsx`:

```typescript
import { CoherenceAnalysisPanel } from '../components/CoherenceAnalysisPanel';

export default function Analysis() {
  // ... código existente ...

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* ... código existente ... */}

      <main className="max-w-5xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* ... seções existentes ... */}

            {/* NOVO: Seção de Análise de Coerência */}
            {data.coherenceReports && data.coherenceReports.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                  <Scale size={28} className="text-purple-500" /> 
                  Análise de Coerência Legislativa
                </h2>
                
                <CoherenceAnalysisPanel
                  coherenceScore={data.coherenceScore || 100}
                  incoherences={data.coherenceReports[0]?.incoherences_data || []}
                  summary={data.coherenceReports[0]?.summary || ''}
                  promiseText={data.text}
                  politicianName={data.author}
                />
              </section>
            )}

            {/* ... resto do código ... */}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Passo 4: Usar Componentes de Legibilidade Melhorada

Modificar `client/src/components/PromiseCard.tsx` para usar os novos componentes:

```typescript
import { AnalysisTextBlock, AnalysisPointsList } from './AnalysisTextBlock';
import { Info, AlertTriangle, Zap } from 'lucide-react';

export function PromiseCard({
  // ... props existentes ...
  reasoning,
  risks
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* ... código existente ... */}

      {/* NOVO: Usar AnalysisTextBlock para reasoning */}
      {reasoning && (
        <AnalysisTextBlock
          title="Análise Técnica"
          content={reasoning}
          type="reasoning"
          icon={<Info size={18} className="text-blue-600" />}
          expandable={true}
          maxLines={3}
        />
      )}

      {/* NOVO: Usar AnalysisPointsList para riscos */}
      {risks && risks.length > 0 && (
        <AnalysisPointsList
          title="Riscos de Descumprimento"
          points={risks}
          type="risk"
          icon={<AlertTriangle size={18} className="text-red-600" />}
        />
      )}
    </div>
  );
}
```

---

## 📊 Melhorias de Legibilidade

### Problema Identificado

O texto de análise estava "tudo junto", dificultando a leitura. Blocos de análise técnica, evidências e riscos eram apresentados em um único parágrafo.

### Solução Implementada

#### 1. **Componente `AnalysisTextBlock`**

Fornece:
- Títulos claros com ícones
- Conteúdo com espaçamento adequado
- Expansão/colapso para textos longos
- Cópia para área de transferência
- Diferentes cores por tipo de conteúdo

**Exemplo de Uso:**

```typescript
<AnalysisTextBlock
  title="Análise Técnica"
  content="Este texto longo de análise será formatado de forma clara..."
  type="reasoning"
  icon={<Info size={18} />}
  expandable={true}
  maxLines={3}
/>
```

#### 2. **Componente `AnalysisPointsList`**

Fornece:
- Listas numeradas com melhor visual
- Separação clara de pontos
- Ícones por tipo de ponto
- Cores consistentes

**Exemplo de Uso:**

```typescript
<AnalysisPointsList
  title="Riscos de Descumprimento"
  points={[
    "Risco 1: Falta de orçamento aprovado",
    "Risco 2: Dependência de aprovação do Congresso",
    "Risco 3: Mudanças econômicas"
  ]}
  type="risk"
  icon={<AlertTriangle size={18} />}
/>
```

#### 3. **Painel de Coerência Legislativa**

Fornece:
- Score visual com barra de progresso
- Incoerências expandíveis
- Detalhes claros de cada contradição
- Links para votações oficiais

---

## 🚀 Guia de Implementação

### Fase 1: Backend (1-2 dias)

1. **Criar migração do Supabase:**
   ```bash
   supabase migration new add_promise_coherence_table
   ```

2. **Implementar o serviço:**
   ```bash
   # Arquivos já criados:
   # - server/modules/coherence-analyzer.ts
   # - server/services/coherence.service.ts
   ```

3. **Integrar no fluxo de análise:**
   - Modificar `server/services/analysis.service.ts`
   - Adicionar chamada a `coherenceService.analyzePromisesCoherence()`

4. **Testar:**
   ```bash
   pnpm test server/modules/coherence-analyzer.test.ts
   pnpm test server/services/coherence.service.test.ts
   ```

### Fase 2: Frontend (1-2 dias)

1. **Adicionar componentes:**
   ```bash
   # Arquivos já criados:
   # - client/src/components/CoherenceAnalysisPanel.tsx
   # - client/src/components/AnalysisTextBlock.tsx
   ```

2. **Integrar na página de análise:**
   - Modificar `client/src/pages/Analysis.tsx`
   - Adicionar `<CoherenceAnalysisPanel />`

3. **Atualizar PromiseCard:**
   - Usar `<AnalysisTextBlock />` para reasoning
   - Usar `<AnalysisPointsList />` para riscos

4. **Testar:**
   ```bash
   pnpm test:e2e client/src/pages/Analysis.tsx
   ```

### Fase 3: Testes e Refinamento (1-2 dias)

1. **Testes unitários:**
   - Cobertura de casos de incoerência
   - Validação de scores
   - Tratamento de erros

2. **Testes E2E:**
   - Fluxo completo de análise
   - Exibição de incoerências
   - Interação com componentes

3. **Testes de usabilidade:**
   - Legibilidade dos blocos de texto
   - Clareza das incoerências
   - Navegação e links

---

## 📝 Próximos Passos

### Curto Prazo (1-2 semanas)

1. ✅ Implementar análise de coerência
2. ✅ Melhorar legibilidade dos blocos de texto
3. ⏳ Integrar componentes no frontend
4. ⏳ Testes completos

### Médio Prazo (1-2 meses)

1. Adicionar análise de vetos (além de votos)
2. Expandir para Senado Federal
3. Análise de promessas municipais vs. votações
4. Dashboard de políticos com histórico de coerência

### Longo Prazo (3+ meses)

1. Machine Learning para detecção automática de temas
2. Análise de sentimento para detectar mudanças de posição
3. Comparação entre políticos
4. API pública para integração com outras plataformas

---

## 🔗 Referências

- **API da Câmara dos Deputados:** https://dadosabertos.camara.leg.br/swagger/recursos.html
- **Documentação Supabase:** https://supabase.com/docs
- **React Best Practices:** https://react.dev

---

## 📞 Suporte

Para dúvidas ou problemas na implementação, consulte:

1. Documentação do projeto: `ARCHITECTURE.md`
2. Comentários no código
3. Testes como exemplos de uso

---

**Desenvolvido com ❤️ para transparência política**
