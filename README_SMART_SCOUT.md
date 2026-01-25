# 🚀 SmartScout - Sistema Inteligente de Busca

## Visão Geral
O SmartScout substitui o sistema antigo de scraping por uma abordagem baseada em APIs oficiais e fontes confiáveis, garantindo estabilidade e qualidade de dados.

## Principais Melhorias

### ✅ Fontes Confiáveis
- **APIs Governamentais**: Câmara, Senado, Portal da Transparência
- **Fontes Institucionais**: Base dos Dados, IPEA, IBGE
- **Mídia Confiável**: RSS de fontes estáveis (Agência Brasil, BBC, DW)

### ✅ Performance
- Cache em 3 níveis (memória, Supabase, stale fallback)
- Busca em paralelo com timeouts
- Priorização por relevância

### ✅ Resiliência
- Fallbacks automáticos
- Tolerância a falhas por fonte
- Retry estratégico

## Como Usar

```typescript
import { ScoutAgent } from './server/agents/scoutAgent';

const scout = new ScoutAgent();

// Busca básica
const results = await scout.execute('Nome do Político');
```

## Métricas de Qualidade

| Métrica | Alvo | Como Medir |
| :--- | :--- | :--- |
| Taxa de Sucesso | 90% | results.totalResults > 0 |
| Latência P95 | < 3s | Tempo de resposta |
| Cache Hit Rate | 70% | scout.getCacheStats() |
| Fontes Ativas | 5 | scout.getSourceStats() |
