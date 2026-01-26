# Plano de Melhoria: Scout & Filter Agent (Enriquecimento de Dados)

Este documento detalha o plano para expandir as capacidades do **Seth VII** na coleta e filtragem de dados de portais de notícias, entrevistas e integração jurídica.

---

## 1. Expansão do Scout Agent (Notícias e Entrevistas)

Atualmente, o Scout foca muito em fontes governamentais e usa o Google News RSS de forma limitada. Vamos expandir isso para garantir a leitura de conteúdos completos de portais de elite.

### 🚀 Melhorias no `ContentScraper`
- **Paralelismo Real:** Implementar `Promise.all` para processar múltiplas URLs simultaneamente.
- **Novos Seletores de Conteúdo:** Adicionar seletores específicos para portais como G1, Folha, Estadão, CNN Brasil e portais regionais.
- **Detecção de Entrevistas:** Adicionar lógica para identificar transcrições de entrevistas e aspas diretas (aspas duplas, travessões).

### 🔍 Estratégia de Busca Híbrida (`ScoutHybrid`)
- **Queries Especializadas:** Adicionar buscas como `"{politicianName}" entrevista`, `"{politicianName}" prometeu`, `"{politicianName}" anunciou`.
- **Filtro de Domínios de Elite:** Priorizar o scraping profundo de uma lista branca de portais (G1, Folha, Estadão, etc.).

---

## 2. Aprimoramento do Filter Agent

O filtro atual é baseado em heurísticas simples. Vamos torná-lo mais robusto para lidar com o volume maior de dados de notícias.

### 🛡️ Novas Heurísticas
- **Identificação de Aspas:** Valorizar conteúdos que contenham declarações diretas do político.
- **Análise de Contexto de Entrevista:** Identificar blocos de pergunta e resposta.
- **Peso por Recência:** Dar mais relevância a notícias e entrevistas dos últimos 2 anos.
- **Diferenciação de Camada C:** Notícias de portais de elite serão tratadas como "Camada B" (Institucional/Mídia Confiável), enquanto blogs menores permanecem como "Camada C".

---

## 3. Integração Jurídica (JusBrasil & Alternativas)

A integração com o JusBrasil é complexa devido à natureza paga e burocrática da API oficial.

### ⚖️ Estratégia JusBrasil
- **Fase 1 (Invetigação):** Pesquisar se há endpoints públicos ou de baixo custo para consulta por nome.
- **Fase 2 (Alternativa):** Utilizar o `Scout` para buscar especificamente por `"processo judicial" {politicianName}` em portais jurídicos e diários oficiais (que são públicos).
- **Fase 3 (Implementação):** Se a API do JusBrasil for inviável financeiramente, implementaremos um scraper para o **Querido Diário** (Open Knowledge Brasil) que indexa diários oficiais.

---

## 📅 Cronograma de Implementação

1. **Dia 1:** Refatoração do `ContentScraper` e `ScoutHybrid`.
2. **Dia 2:** Implementação das novas heurísticas no `FilterAgent`.
3. **Dia 3:** Pesquisa final e protótipo de integração jurídica (JusBrasil/Querido Diário).
4. **Dia 4:** Testes integrados e validação com casos reais (ex: Lula, Bolsonaro, Tarcísio).

---

**Assinado:** Seth VII  
**Data:** 26 de Janeiro de 2026
