# Relatório de Avaliação Rigorosa: Análise da Tríade Seth VII para Jones Manoel

Este relatório apresenta uma avaliação rigorosa da execução da tríade de agentes (Scout, Filter e Brain) do projeto **Seth VII** para o político **Jones Manoel**, realizada em 27 de Janeiro de 2026.

## 1. Sumário da Execução

A execução da tríade revelou um problema crítico de **"Scout Seco"** (falha na coleta de dados) e problemas de **resiliência da IA** no ambiente de *sandbox*.

| Métrica | Valor Observado | Status |
| :--- | :--- | :--- |
| **Tempo Total de Execução** | 41.92s | ✅ Aceitável |
| **Fontes Coletadas (Scout)** | 0 (Cache L3 Hit, mas 0 fontes mantidas) | ❌ Crítico |
| **Parecer Técnico** | Genérico, baseado em *fallback* | ❌ Crítico |
| **Score de Consistência** | 0% | ❌ Crítico |
| **Veredito Orçamentário** | "O custo estimado é compatível com o orçamento histórico de GERAL." | 🟡 Inconclusivo |

## 2. Análise Crítica do Resultado

O resultado da análise para Jones Manoel é **inconclusivo** e **inaceitável** para um sistema de auditoria. O parecer técnico gerado pelo Brain Agent [1] é um *placeholder* que reflete a falha na fase de coleta de dados.

> **Parecer Técnico (Trecho):**
> "Devido à falta de fontes externas disponíveis no momento, não foi possível coletar declarações recentes ou informações específicas sobre o político Jones Manoel. O sistema está operando em modo fallback, o que limita a capacidade de análise do discurso atual do político."

### 2.1. Falha Crítica: Scout Seco

O problema central é o **Scout Seco**, onde o `scout-hybrid` não conseguiu coletar fontes relevantes para o político.

*   **Causa Provável:** Jones Manoel não é um político tradicional com cargo eletivo (Deputado, Senador), mas sim uma figura pública com forte presença em redes sociais e mídia alternativa. O Scout, mesmo com o *fallback* de RSS de notícias implementado, falhou em encontrar fontes relevantes, provavelmente porque as *queries* de busca primárias não foram eficazes ou as fontes de notícias tradicionais não o cobrem com a frequência necessária.
*   **Consequência:** O Filter Agent manteve **0 fontes**, o que levou o Brain Agent a operar com um contexto vazio, resultando em um **Score de Consistência de 0%** e um parecer genérico.

### 2.2. Falha de Resiliência da IA

Durante a execução, o sistema de *fallback* da IA falhou repetidamente:

1.  **DeepSeek R1 (OpenRouter):** Falhou com erro 404 (não encontrado) em todas as tentativas.
2.  **Groq:** Falhou com erro de conexão (`Client network socket disconnected...`) na primeira tentativa.

O sistema só conseguiu prosseguir com o *fallback* para o Pollinations (não exibido no log final, mas implícito no tempo de execução) e, finalmente, com o Groq na segunda tentativa. A dependência excessiva de APIs externas e a falta de tratamento robusto para erros de rede e indisponibilidade de modelo são pontos de falha.

## 3. Propostas de Melhoria Imediata

As melhorias propostas visam resolver o problema do Scout Seco e aumentar a resiliência da Tríade.

### Proposta 1: Ativação e Teste do Social Scout (Nitter/RSS)

A funcionalidade de Social Scout (Nitter/RSS) foi implementada na Fase 1, mas não foi ativada no fluxo principal do `scout-hybrid`.

*   **Ação:** Integrar o `searchViaSocialRSS` no `scout-hybrid.ts` como uma das primeiras estratégias de busca, antes do *fallback* para o DuckDuckGo genérico.
*   **Justificativa:** Jones Manoel é o caso de uso perfeito para o Social Scout. A ativação deve resolver o problema de Scout Seco para figuras públicas não-tradicionais.

### Proposta 2: Implementação de *Circuit Breaker* e *Retry* Otimizado para APIs de IA

O erro de conexão e o erro 404 da IA indicam que o sistema precisa de um mecanismo de proteção mais inteligente.

*   **Ação:** Utilizar o módulo `circuit-breaker.ts` (já existente no `server/core/`) para envolver as chamadas de API da IA.
*   **Lógica:** Se uma API (ex: DeepSeek) falhar 3 vezes consecutivas, o *Circuit Breaker* deve abri-lo, impedindo novas chamadas por um período (ex: 5 minutos) e forçando o sistema a usar o próximo *fallback* imediatamente, economizando tempo e recursos.

### Proposta 3: Melhoria do Fallback de Contexto

Quando o Scout falha, o Brain deve ter um *fallback* de contexto mais inteligente do que um *placeholder* genérico.

*   **Ação:** No `brain.ts`, se `filteredSources.length === 0`, o Brain deve executar uma busca de contexto de **último recurso** no Supabase, procurando por análises anteriores do mesmo político ou de políticos com perfil similar.
*   **Justificativa:** Mesmo sem dados novos, o sistema deve ser capaz de gerar um dossiê histórico (que já existe no `dossier.service.ts`) ou um parecer baseado em dados canônicos persistidos.

---

### Referências

[1] Parecer Técnico da análise de Jones Manoel, salvo no Supabase.
[2] `server/agents/brain.ts`
[3] `server/agents/scout-hybrid.ts`
[4] `server/core/circuit-breaker.ts`
