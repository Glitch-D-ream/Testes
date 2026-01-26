# 🛡️ Auditoria Técnica e Proposta: Tríade de Agentes 2.0

Este documento apresenta uma análise rigorosa das limitações atuais da Tríade de Agentes (**Scout**, **Filter**, **Brain**) e propõe uma reestruturação avançada para elevar o sistema ao patamar de inteligência de auditoria autônoma.

---

## 1. Diagnóstico de Limitações (Arquitetura Atual)

A implementação atual, embora funcional, é considerada **rudimentar** devido aos seguintes gargalos técnicos identificados na auditoria de código:

### 🔍 Scout (O Buscador)
*   **Miopia de Fontes:** Depende excessivamente de RSS (Google News) e buscas simples no DuckDuckGo. Não explora redes sociais (X/Twitter, Instagram) ou transcrições de vídeos (YouTube), onde a maioria das promessas modernas é feita.
*   **Scraping Estático:** O `content-scraper.ts` usa `cheerio`, que falha em sites que dependem de renderização JavaScript (SPA/React), perdendo conteúdo de portais modernos.
*   **Falta de Memória:** O Scout não "aprende" quais fontes são mais produtivas para determinados políticos, repetindo buscas genéricas a cada ciclo.

### 🧹 Filter (O Filtro)
*   **Heurística Frágil:** A filtragem em `filter.ts` baseia-se em listas de palavras-chave (*keywords*) e tamanho de texto. Isso gera muitos "falsos positivos" (notícias genéricas) e "falsos negativos" (promessas implícitas ou complexas).
*   **Descarte Cego:** O filtro descarta fontes sem considerar o contexto acumulado. Uma notícia curta pode ser o "elo perdido" para validar uma promessa maior encontrada em outra fonte.

### 🧠 Brain (O Auditor)
*   **Contexto Fragmentado:** O Brain analisa as fontes de forma isolada ou em um único bloco de texto, sem uma **Memória de Longo Prazo (RAG)**. Ele não consegue correlacionar uma promessa de hoje com um dado orçamentário de dois anos atrás de forma semântica profunda.
*   **Dependência de Fallbacks:** O uso excessivo de valores padrão (ex: R$ 500Mi em `probability.ts`) quando a IA falha em extrair valores reais distorce o score de viabilidade.

---

## 2. Proposta de Reestruturação: Tríade 2.0

A nova arquitetura foca em **Orquestração Inteligente** e **Enriquecimento de Contexto**.

### 🚀 Scout 2.0: O Explorador Multimodal
*   **Agentes de Visão/Áudio:** Implementar workers que utilizam `yt-dlp` e modelos de *Speech-to-Text* (Whisper) para auditar lives e discursos em vídeo.
*   **Navegação Headless:** Migrar do `cheerio` para `Puppeteer` ou `Playwright` no scraper para capturar conteúdo de sites dinâmicos.
*   **Descoberta Semântica:** O Scout deve usar a IA para gerar variações de busca baseadas no cargo e histórico do político (ex: "Lula + Novo PAC + Saneamento").

### 🛡️ Filter 2.0: O Analista de Relevância
*   **Classificação por Embeddings:** Em vez de palavras-chave, usar vetores de similaridade para classificar se um texto é uma "Promessa", "Ataque Político" ou "Notícia Institucional".
*   **Agrupamento (Clustering):** Agrupar notícias que falam do mesmo assunto antes de enviar ao Brain, reduzindo o ruído e o custo de tokens.

### 🧠 Brain 2.0: O Auditor Cognitivo
*   **Arquitetura RAG (Retrieval-Augmented Generation):** Implementar um banco vetorial (Supabase Vector) para que o Brain consulte:
    1.  **Histórico de Votos** (Câmara/Senado).
    2.  **Execução Orçamentária Real** (SICONFI).
    3.  **Promessas Anteriores** (Diz vs Faz).
*   **Cadeia de Raciocínio (CoT):** Forçar o Brain a gerar um "Rascunho de Auditoria" interno antes de emitir o veredito final, aumentando o rigor técnico.

---

## 3. Matriz de Melhorias Técnicas

| Componente | Implementação Atual | Proposta 2.0 | Impacto Esperado |
| :--- | :--- | :--- | :--- |
| **Coleta** | RSS + DuckDuckGo | Multimodal (Vídeo/Social) + Headless Scraper | +60% de cobertura de promessas |
| **Filtragem** | Regex + Keywords | NLP Semântico (Embeddings) | -40% de ruído nas análises |
| **Análise** | Prompt Único | RAG + Chain of Thought | Precisão de Auditoria Estatal |
| **Dados** | Fallbacks Estáticos | Integração Dinâmica SICONFI/TSE | Fim das "alucinações" de valores |

---

## 4. Plano de Ação Imediato

1.  **Sprint 1 (Resiliência):** Substituir `cheerio` por um serviço de scraping robusto e implementar o banco vetorial no Supabase.
2.  **Sprint 2 (Inteligência):** Refatorar o `ai.service.ts` para usar RAG, alimentando o prompt com dados reais do SICONFI e histórico do TSE de forma estruturada.
3.  **Sprint 3 (Autonomia):** Configurar o Scout para monitorar canais oficiais do YouTube e perfis no X (via Nitter ou APIs de scraping).

---
**Assinado:** Seth VII  
**Data:** 26 de Janeiro de 2026
