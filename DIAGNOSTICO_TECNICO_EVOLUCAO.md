# 🛡️ Diagnóstico Técnico: Seth VII (Versão Atual vs. Necessidade de Rigor)

Após rodar o sistema com Jones Manoel, identifiquei limitações que tornam o resultado **rudimentar** para uma ferramenta de inteligência de alto nível.

## 1. Falhas Identificadas (Visão Crítica)

| Componente | Limitação Atual | Impacto |
| :--- | :--- | :--- |
| **VulnerabilityAuditor** | Resumos genéricos ("discurso radical"). | Falta de **provas**. O sistema não cita a frase exata ou o artigo onde a contradição ocorre. |
| **BenchmarkingAgent** | Dependência de IDs oficiais (Câmara/Senado). | Políticos fora do cargo (como Jones) ficam com **score zero**, ignorando sua influência real e produção intelectual. |
| **Data Lineage** | Rastreabilidade apenas por "tipo de fonte". | Não permite ao usuário clicar e ver o **parágrafo exato** que gerou o alerta de risco. |
| **NLP** | Classificação binária (Radical/Moderado). | Ignora nuances como "Radicalismo em pautas econômicas vs. Moderado em pautas institucionais". |

---

## 2. Proposta de Melhorias Imediatas (Salto de Qualidade)

### A. Módulo de "Evidence Mining" (Mineração de Evidências)
Em vez de apenas ler o texto, o sistema passará a extrair **Entidades de Conflito**:
- **Promessas de Ruptura:** Identificar termos como "estatização", "revogação", "expropriação".
- **Contradição Temporal:** Cruzar o que foi dito em um blog em 2022 com uma entrevista de 2025.

### B. Benchmarking Ideológico e de Audiência
Para políticos sem cargo, usaremos métricas de **Engajamento e Relevância de Pauta**:
- **Share of Voice:** Comparar a frequência de termos de Jones Manoel com outros influenciadores de esquerda (ex: Boulos, Gleisi).
- **Densidade Teórica:** Medir o nível de complexidade do vocabulário (Índice de Gunning Fog) para dar base real ao "Complexity Penalty".

### C. Relatório de Vulnerabilidade "Hard-Fact"
O novo prompt exigirá:
1. **Citação Direta:** "O político afirmou [X] na fonte [Y]".
2. **Vetor de Ataque Lógico:** "Se ele defende [X], isso colide com o dado orçamentário [Z]".

---

## 3. Próximos Passos de Implementação

1. **Refatorar `vulnerability.ts`** para exigir citações e evidências.
2. **Criar `ideology-benchmarking.ts`** para comparar temas e termos, não apenas votos.
3. **Atualizar o `BrainAgent`** para consolidar essas evidências em um "Dossiê de Contradições".

> **Veredito:** O sistema atual é um "termômetro". O que vamos construir agora é um "microscópio".
