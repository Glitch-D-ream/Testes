# Relatório de Avaliação Rigorosa V2: Análise da Tríade Seth VII para Jones Manoel

Este relatório avalia o segundo teste de execução da tríade de agentes para **Jones Manoel**, realizado após a integração do **Social Scout (Nitter/RSS)** e a correção dos modelos de IA.

## 1. Sumário da Execução V2

A execução V2 foi mais rápida (23.47s), mas o problema central de **"Scout Seco"** persistiu, e a instabilidade das APIs de IA se tornou mais evidente.

| Métrica | V1 (Antes) | V2 (Depois) | Status |
| :--- | :--- | :--- | :--- |
| **Tempo Total** | 41.92s | 23.47s | ✅ Melhoria |
| **Fontes Coletadas** | 0 | 0 | ❌ Crítico |
| **Parecer Técnico** | Genérico (*Fallback*) | Genérico (*Fallback*) | ❌ Crítico |
| **Score de Consistência** | 0% | 0% | ❌ Crítico |
| **Falhas de IA** | DeepSeek (404), Groq (Conexão) | DeepSeek (404), Groq (429 - Rate Limit) | ❌ Persistente |

## 2. Análise Crítica das Falhas

### 2.1. Falha do Social Scout (Scout Seco Persistente)

Apesar da integração do `searchViaSocialRSS` no `ScoutHybrid` [1] e da lógica para tentar múltiplas variações de username, o Scout não conseguiu coletar dados de redes sociais para Jones Manoel.

*   **Diagnóstico:** O problema é duplo:
    1.  **Instabilidade do Nitter:** As instâncias públicas do Nitter são notoriamente instáveis e podem estar bloqueando o acesso do *sandbox* ou falhando na busca.
    2.  **Variação de Username:** A lógica de geração de usernames (`jonesmanoel`, `jones_manoel`, `jones`) pode não ter incluído o username real do político (que pode ser `jonesmanoel_` ou outro).
*   **Consequência:** O Brain Agent [2] operou novamente com contexto vazio, resultando em um parecer inútil e um Score de Consistência de 0%.

### 2.2. Falha Crítica de Resiliência da IA (Rate Limit)

A falha na chamada da API do Groq [3] com o código **429 (Too Many Requests)** é um problema de infraestrutura que deve ser resolvido imediatamente.

*   **Diagnóstico:** O sistema está fazendo chamadas demais em um curto período, atingindo o limite de taxa (Rate Limit) da API. A ausência de um mecanismo de controle faz com que o sistema tente novamente e falhe, desperdiçando tempo e recursos.
*   **Consequência:** O sistema foi forçado a cair para o *fallback* de Pollinations, que também falhou com 429, resultando em uma falha crítica na fase de análise.

## 3. Proposta de Melhoria Imediata (Próximo Passo)

Com base na análise, a prioridade máxima deve ser a **estabilização da infraestrutura de IA**, pois a falha no *Rate Limit* impede qualquer análise, mesmo que o Scout colete dados.

### Proposta: Implementar o Padrão *Circuit Breaker*

A implementação do *Circuit Breaker* no `ai.service.ts` e `ai-groq.service.ts` é a solução técnica mais robusta para este problema.

| Ação | Detalhe |
| :--- | :--- |
| **Implementar Circuit Breaker** | Envolver as chamadas de API do Groq e OpenRouter com o padrão *Circuit Breaker*. |
| **Lógica de Abertura** | Se a API retornar um erro 429 ou 5xx por 3 vezes consecutivas, o *Circuit Breaker* deve **abrir**, impedindo novas chamadas por 5 minutos. |
| **Benefício** | O sistema irá imediatamente pular para o próximo *fallback* (Pollinations) sem desperdiçar tempo tentando uma API que está temporariamente indisponível ou com limite de taxa atingido. |

Após a implementação do *Circuit Breaker*, o próximo passo será aprimorar a lógica de busca do Social Scout (Proposta 1) e implementar o *Fallback* de Contexto (Proposta 3).

---

### Referências

[1] `server/agents/scout-hybrid.ts`
[2] `server/agents/brain.ts`
[3] Log de execução V2 (Erro 429 no Groq)
