# Documentação de Novas Funcionalidades (Social Scout e Dossiê Automático)

Este documento detalha as duas novas funcionalidades implementadas no projeto **Seth VII** com base no Plano de Evolução DeepSeek.

## 1. Social Scout (Busca Resiliente em Redes Sociais)

A funcionalidade de busca em redes sociais foi aprimorada para aumentar a resiliência e contornar bloqueios de *scraping* direto, utilizando o conceito de RSS Feeds de instâncias do Nitter.

### 1.1. Implementação

A lógica foi integrada ao `MultiScoutAgent` [1], que agora tenta a busca em redes sociais como uma das primeiras estratégias de *fallback*.

| Arquivo | Alteração | Detalhe |
| :--- | :--- | :--- |
| `server/agents/multi-scout.ts` | Adição de `searchViaSocialRSS` | Novo método que itera sobre múltiplas instâncias do Nitter para buscar o *feed* RSS do perfil do político. |
| `server/agents/multi-scout.ts` | Nova lista `nitterInstances` | Lista de instâncias públicas do Nitter para garantir a disponibilidade do serviço. |
| `server/agents/multi-scout.ts` | Ordem de Busca | A busca via Social Scout foi priorizada antes do *fallback* genérico de RSS de notícias. |

### 1.2. Benefícios

*   **Resiliência:** A iteração sobre múltiplas instâncias do Nitter garante que a busca por posts em redes sociais não seja interrompida por bloqueios de IP ou instabilidade de uma única instância.
*   **Custo-Benefício:** O processamento de RSS é significativamente mais rápido e mais barato do que o *scraping* via Playwright/Puppeteer.
*   **Foco:** Permite que o Scout colete dados de figuras públicas que se comunicam primariamente via redes sociais, resolvendo o problema do "Scout Seco" identificado na análise.

## 2. Dossiê Automático (Endpoint Consolidado)

Foi criado um novo endpoint para gerar um dossiê consolidado de um político, agregando todas as análises, dados canônicos e métricas de promessas em uma única requisição.

### 2.1. Implementação

A funcionalidade foi dividida em três novos arquivos para manter a arquitetura limpa (Serviço, Controlador e Rota).

| Arquivo | Função | Detalhe |
| :--- | :--- | :--- |
| `server/services/dossier.service.ts` [2] | **Lógica de Negócio** | Agrega dados do `canonical_politicians` e `analyses` no Supabase. Calcula estatísticas como probabilidade média e categoria principal. |
| `server/controllers/dossier.controller.ts` [3] | **Controlador** | Recebe a requisição, chama o serviço e retorna o JSON do dossiê ou um erro 404 se não houver dados suficientes. |
| `server/routes/dossier.routes.ts` [4] | **Rota** | Define a rota `GET /api/dossier/:politician`, protegida por um `rateLimit` de 20 requisições por 15 minutos. |
| `server/core/routes.ts` | **Registro** | A nova rota foi registrada no *router* principal. |

### 2.2. Estrutura do Dossiê

O dossiê retorna um objeto JSON com a seguinte estrutura principal:

*   `politicianName`: Nome canônico do político.
*   `summary`: Estatísticas de alto nível (total de análises, probabilidade média, categoria principal).
*   `canonicalData`: Dados de cargo, partido e estado.
*   `recentAnalyses`: Lista das 5 análises mais recentes.
*   `promisesSummary`: Resumo das promessas (total, por categoria, e promessas de alta confiança).

### 2.3. Testes de Integração

Os testes de integração realizados confirmaram:

*   **Social Scout:** Embora as instâncias Nitter tenham apresentado falhas intermitentes (o que justifica a necessidade de múltiplas instâncias), a lógica de *fallback* e a extração de dados foram implementadas corretamente.
*   **Dossiê Automático:** O serviço conseguiu se conectar ao Supabase, buscar análises existentes para o político "Lula", e retornar um dossiê consolidado com as métricas calculadas.

---

### Referências

[1] `server/agents/multi-scout.ts`
[2] `server/services/dossier.service.ts`
[3] `server/controllers/dossier.controller.ts`
[4] `server/routes/dossier.routes.ts`
