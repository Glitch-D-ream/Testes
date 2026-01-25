# 🛡️ Relatório Técnico: Projeto Seth VII (Janeiro 2026)

Este documento detalha as intervenções técnicas realizadas, a arquitetura atual do sistema de auditoria política e os planos de otimização propostos para o **Seth VII**.

---

## 1. Estado Atual da Arquitetura (Pós-Intervenção)

O Seth VII opera como um sistema autônomo de auditoria técnica baseado em uma tríade de agentes, agora reforçado com camadas de blindagem e resiliência.

### 🧠 A Tríade de Agentes
1.  **Scout (Híbrido):** Realiza busca em fontes oficiais (Câmara, Senado, TSE) e varredura web (DuckDuckGo/Google News).
2.  **Filter:** Realiza a limpeza de ruído e validação de relevância das fontes coletadas.
3.  **Brain (O Auditor):** O núcleo de inteligência que cruza as declarações com dados do **SICONFI** (Tesouro Nacional) e **IBGE**.

### 🛠️ Modificações Realizadas (Janeiro 2026)
*   **Blindagem Anti-Alucinação:** Implementação de *System Prompts* de rigor máximo, proibindo a IA de inventar dados e forçando a declaração de "Dados insuficientes" em caso de lacunas.
*   **Neutralidade Técnica:** Remoção de qualquer viés emocional ou adjetivação no tom de voz da IA, adotando um padrão de "Auditoria Fria" (estilo Tribunal de Contas).
*   **Relatórios em Markdown Profissional:** Substituição de templates estáticos por geração dinâmica de relatórios estruturados com tabelas de viabilidade e matrizes de risco.
*   **Correção de Fluxo de Dados:** Sincronização dos dados orçamentários reais (Total, Executado, Taxa) entre o backend e os cards do frontend.
*   **Estabilidade de Banco:** Ajuste de compatibilidade com o schema do Supabase, garantindo persistência sem erros 500.

---

## 2. Hierarquia de Inteligência (Fail-Safe)

O sistema foi configurado com uma cadeia de fallback em 4 níveis para garantir 100% de disponibilidade:

1.  **Primário:** DeepSeek R1 (Raciocínio Profundo via OpenRouter).
2.  **Secundário:** Pollinations AI (Modelos OpenAI/Mistral/Llama).
3.  **Backup de Elite:** Modelos de código aberto (Llama-3.3-70B, Mistral-Large) via APIs gratuitas.
4.  **Local:** Motor de NLP baseado em Regex para extração básica offline.

---

## 3. Diagnóstico de Performance (Gargalos Identificados)

Atualmente, o sistema apresenta latência elevada (30s a 90s por análise) devido aos seguintes fatores:
*   **Scraping Síncrono:** A leitura de notícias é feita de forma sequencial, onde uma URL lenta trava todo o processo.
*   **Múltiplas Chamadas de IA:** O fluxo exige várias passagens pela IA para extração, filtragem e redação final.
*   **Timeouts Longos:** Espera excessiva por APIs governamentais instáveis antes de ativar o fallback.

---

## 4. Planos de Melhoria Propostos (Para Análise DeepSeek)

### 🚀 Plano A: Otimização de Latência (Curto Prazo)
*   **Paralelismo de Rede:** Implementar `Promise.all` no `ContentScraper` para ler todas as fontes simultaneamente.
*   **Ajuste de Timeouts:** Reduzir o tempo de espera de APIs externas de 15s para 5s, priorizando a fluidez do sistema.
*   **Pré-processamento Local:** Usar NLP local para filtrar 50% do ruído antes de enviar o texto para a IA, reduzindo o tamanho do prompt e o custo/tempo de processamento.

### 🏗️ Plano B: Arquitetura de Dados (Médio Prazo)
*   **Consolidação de Prompts:** Unificar a extração de promessas e a geração do relatório em uma única chamada de contexto longo.
*   **Cache de Conteúdo Bruto:** Armazenar o texto extraído de notícias populares por 24h para evitar re-scraping.
*   **Vetorização (RAG):** Implementar uma base vetorial simples para que o Brain consulte fatos históricos sem precisar re-analisar todo o histórico do político em cada busca.

### 🎨 Plano C: UX e Escalabilidade (Longo Prazo)
*   **Streaming de Resposta:** Implementar WebSockets para que o usuário veja o relatório sendo construído em tempo real.
*   **Arquitetura de Workers:** Mover o processamento pesado para filas (BullMQ/Redis), liberando o servidor principal para atender mais usuários simultaneamente.

---

**Assinado:** Agente de Desenvolvimento Seth VII
**Data:** 25 de Janeiro de 2026
