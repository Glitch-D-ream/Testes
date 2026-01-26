# Relatório Técnico: A Grande Simplificação e Próximos Passos do Seth VII

**Autor:** Seth VII
**Data:** 26 de Janeiro de 2026
**Foco:** Auditoria, Correção e Enriquecimento de Dados Oficiais

---

## 1. Contexto e Justificativa: A Grande Simplificação

A **Grande Simplificação** foi uma refatoração estratégica do projeto Seth VII, motivada pela necessidade de trocar a **complexidade e a baixa credibilidade** da análise de notícias (Scout e Filter) pela **precisão e alta credibilidade** dos dados oficiais.

O diagnóstico inicial, validado por terceiros, apontou que o sistema estava gastando recursos significativos para gerar resultados "ricos, porém falsos" (alucinações e ruído). A solução foi desativar o módulo de análise de discurso e focar em ser um auditor técnico de dados governamentais.

## 2. Ações Realizadas (Fases de Implementação)

As seguintes ações foram implementadas no código-fonte, culminando na versão atual estável e focada em dados oficiais:

### 2.1. Estabilização da Base de Dados e Arquitetura

| Ação | Detalhe da Implementação | Impacto |
| :--- | :--- | :--- |
| **Tabela Canônica** | Criação da tabela `canonical_politicians` no Supabase, contendo IDs oficiais (Câmara/Senado) para 20 políticos. | Garante que o sistema analise o político correto, eliminando a ambiguidade. |
| **Desativação da Tríade** | Suspensão dos agentes `Scout` e `Filter` no orquestrador (`search.service.ts`). | Redução drástica de latência, consumo de recursos e eliminação de ruído de notícias. |
| **Correção de Deploy** | Correção de erro de sintaxe no `Analysis.tsx` e configuração da versão do Node.js (`.nvmrc` e `package.json`) para `22.22.0`. | Resolução do erro de build no Railway, garantindo a continuidade do CI/CD. |

### 2.2. Enriquecimento do Relatório com Dados Oficiais

O agente `Brain` foi refatorado para se tornar um consolidador de dados oficiais, preenchendo o relatório com informações verificáveis:

| Módulo | Ação de Enriquecimento | Detalhe Técnico |
| :--- | :--- | :--- |
| **Perfil** | Busca de Perfil Oficial | Integração direta com as APIs da Câmara e do Senado para obter **cargo, partido e UF** usando o ID Canônico. |
| **Orçamento** | Correção SICONFI | Ajuste na integração (`siconfi.ts`) para focar no código do ente **União (1)**, garantindo dados orçamentários federais corretos. |
| **Legislativo** | Projetos de Lei Recentes | Implementação de funções para buscar e listar os **5 projetos de lei mais recentes** do político (Câmara: `getProposicoesDeputado`, Senado: `getMateriasSenador`). |
| **Persistência** | Correção de Schema | Ajuste no `brain.ts` para salvar o objeto de resultados completo no campo `data_sources` (JSONB) do Supabase, garantindo que o frontend receba todos os dados enriquecidos. |

## 3. Proposta de Melhorias Estratégicas (Próxima Fase)

Com a base estável e credível, a próxima fase deve focar em transformar os dados crus em **inteligência acionável** para o usuário.

### 3.1. Foco: Análise de Votações e Coerência Legislativa

A incoerência temporal (`temporal-incoherence.service.ts`) já existe, mas precisa ser alimentada com dados reais.

| Objetivo | Detalhe da Implementação | Justificativa |
| :--- | :--- | :--- |
| **Análise de Votações** | Implementar a busca e processamento das **10 votações mais importantes** do político no último ano. | Fornece conteúdo rico e factual, respondendo à pergunta: "O que ele fez de fato?". |
| **Cálculo de Coerência** | Refinar o `temporal-incoherence.service.ts` para cruzar o **discurso** (se reintroduzido) ou a **plataforma do partido** com o histórico de votações. | Gera o *score* de credibilidade central do projeto, baseado em "Diz vs. Faz". |
| **Veredito Orçamentário** | Substituir o placeholder de `probability_score` por um **Veredito Orçamentário** (ex: "Execução Adequada" ou "Baixa Eficiência"). | Gerencia a expectativa do usuário e transforma o dado cru do SICONFI em uma conclusão. |

### 3.2. Próxima Etapa de Código (Sugestão de Foco)

O próximo passo lógico é finalizar a integração de dados legislativos, focando no **serviço de incoerência temporal**.

1.  **Refatorar `temporal-incoherence.service.ts`:** Mudar a função `analyzeIncoherence` para receber o `politicianId` canônico e buscar as votações diretamente nas APIs da Câmara/Senado, em vez de depender de promessas extraídas de notícias (que estão suspensas).
2.  **Ajustar o `Brain`:** Integrar o novo veredito orçamentário e o resultado da análise de votações no relatório final.

---
**Assinado:** Seth VII
**Status:** Código base estável e pronto para enriquecimento de dados.
