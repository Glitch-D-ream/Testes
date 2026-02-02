# Guia de Manutenção do Super Orchestrator (Agentes de Coleta)

Este documento explica como gerenciar e reativar os agentes de coleta de dados no fluxo do `Super Orchestrator`.

## 1. Localização do Código

O arquivo principal de configuração dos agentes é:
`server/scripts/super-orchestrator.ts`

A seção de interesse é o bloco `Promise.all` que inicia a coleta multidimensional.

## 2. Gerenciamento de Agentes (Ativar/Desativar)

Para controlar quais agentes estão ativos, você deve editar o bloco `Promise.all` no arquivo `super-orchestrator.ts`.

### Estrutura Atual (Modo Simplificado)

No momento, o código está configurado para rodar apenas os agentes essenciais para o teste de velocidade:

```typescript
// server/scripts/super-orchestrator.ts (Trecho)

// ...
    // --- CONFIGURAÇÃO DE AGENTES ATIVOS ---
    // Mantendo apenas um Legislativo (TSE) e um de Rede Social (DeepSocial)
    // Para reativar outros agentes, descomente as linhas abaixo e adicione-as ao Promise.all
    const [
      governmentPromises, 
      tseHistory,
      socialEvidences,
      // Agentes desativados temporariamente (retornando arrays vazios)
      rawSources, 
      caseEvidences,
      legalRecords, 
      diarioRecords,
      interviewPromises, 
      speechPromises
    ] = await Promise.all([
      // ATIVOS:
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(e => { logWarn(`Erro GovPlan: ${e.message}`); return []; }),
      getPoliticalHistory(politicianName, state).catch(e => { logWarn(`Erro TSE: ${e.message}`); return null; }),
      deepSocialMiner.mine(politicianName).catch(e => { logWarn(`Erro Social: ${e.message}`); return []; }),

      // DESATIVADOS (Simulados):
      Promise.resolve([]), // scoutHybrid.search
      Promise.resolve([]), // scoutCaseMiner.mine
      Promise.resolve([]), // jusBrasilAlternative.searchLegalRecords
      Promise.resolve([]), // jusBrasilAlternative.searchQueridoDiario
      Promise.resolve([]), // scoutInterviewAgent.searchAndExtract
      Promise.resolve([])  // scoutSpeechAgent.searchAndExtract
    ]);
// ...
```

### Tabela de Agentes e Funções

Para reativar um agente, você deve:
1.  **Remover** a linha `Promise.resolve([])` correspondente.
2.  **Substituir** pela chamada da função original (que está comentada ao lado).

| Agente | Chamada da Função Original | Tipo de Dado |
| :--- | :--- | :--- |
| **Notícias/Documentos** | `scoutHybrid.search(politicianName, true).catch(...)` | Notícias, PDFs, Documentos |
| **Casos e Escândalos** | `scoutCaseMiner.mine(politicianName).catch(...)` | Casos de repercussão |
| **Jurídico (Processos)** | `jusBrasilAlternative.searchLegalRecords(politicianName).catch(...)` | Processos Judiciais |
| **Diário Oficial** | `jusBrasilAlternative.searchQueridoDiario(politicianName).catch(...)` | Publicações Oficiais |
| **Entrevistas** | `scoutInterviewAgent.searchAndExtract(politicianName).catch(...)` | Falas e Entrevistas |
| **Discursos** | `scoutSpeechAgent.searchAndExtract(politicianName).catch(...)` | Discursos e Pronunciamentos |

### Exemplo de Reativação (Agente de Notícias/Documentos)

Para reativar o agente `scoutHybrid.search` (Notícias/Documentos), você deve:

1.  **Remover** a linha:
    ```typescript
    Promise.resolve([]), // scoutHybrid.search
    ```
2.  **Adicionar** a chamada da função original na seção **ATIVOS**:
    ```typescript
    scoutHybrid.search(politicianName, true).catch(e => { logWarn(`Erro Scout: ${e.message}`); return []; }),
    ```

**Resultado Esperado no Código:**

```typescript
// ...
    ] = await Promise.all([
      // ATIVOS:
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(e => { logWarn(`Erro GovPlan: ${e.message}`); return []; }),
      getPoliticalHistory(politicianName, state).catch(e => { logWarn(`Erro TSE: ${e.message}`); return null; }),
      deepSocialMiner.mine(politicianName).catch(e => { logWarn(`Erro Social: ${e.message}`); return []; }),
      scoutHybrid.search(politicianName, true).catch(e => { logWarn(`Erro Scout: ${e.message}`); return []; }), // AGORA ATIVO

      // DESATIVADOS (Simulados):
      // Promise.resolve([]), // scoutHybrid.search <--- LINHA REMOVIDA
      Promise.resolve([]), // scoutCaseMiner.mine
// ...
```

Lembre-se de fazer o `git commit` e `git push` após qualquer alteração para que o fluxo do GitHub Actions utilize a nova configuração.
