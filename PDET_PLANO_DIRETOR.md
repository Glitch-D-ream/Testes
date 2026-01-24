# 🚀 Plano Diretor de Evolução Técnica (PDET): Detector de Promessa Vazia

**Versão:** 1.0 (Janeiro 2026)  
**Responsável:** Manus AI  
**Objetivo:** Elevar o sistema ao padrão de auditoria estatal e jornalismo de dados de alta precisão.

---

## 1. Diagnóstico de Maturidade (Baseline)
O sistema atual é um **MVP (Minimum Viable Product) Robusto**. Ele orquestra agentes com sucesso, mas ainda opera em uma camada de dependência de APIs externas e heurísticas de processamento de linguagem natural (NLP) que podem ser refinadas.

| Pilar | Estado Atual | Nível de Rigor |
| :--- | :--- | :---: |
| **Coleta (Scout)** | Busca web multicanal com validação de link. | 7/10 |
| **Análise (Brain)** | IA generativa com cruzamento SICONFI/TSE. | 8/10 |
| **Auditabilidade** | Exposição de fontes e decomposição de score. | 9/10 |
| **Resiliência** | Multi-model fallback (Mistral/Llama/OpenAI). | 8/10 |

---

## 2. Eixos de Melhoria (Curto a Longo Prazo)

### 🟢 Eixo A: Rigor de Dados e Prova de Fato (0-3 meses)
*   **A.1. Crawler de Diários Oficiais:** Implementar integração direta com o API do DOU (Diário Oficial da União) para validar se promessas se transformaram em decretos ou portarias.
*   **A.2. Validação de Orçamento em Tempo Real:** Expandir o uso do SICONFI para incluir restos a pagar (RAP), permitindo saber se o dinheiro prometido está realmente "empenhado" ou apenas "previsto".
*   **A.3. Detector de Contradição Temporal:** Comparar falas do mesmo político em datas diferentes para identificar mudanças de discurso (Flip-flopping).

### 🟡 Eixo B: Inteligência e Imparcialidade Algorítmica (3-6 meses)
*   **B.1. Fine-tuning de Modelo Local:** Treinar um modelo (ex: Llama-3-8B) especificamente em legislação brasileira e contabilidade pública para reduzir alucinações e dependência de APIs externas.
*   **B.2. Índice de Viabilidade Política:** Criar um novo fator de score baseado na base de apoio do político no Congresso/Câmara, usando dados de coalizão governamental.
*   **B.3. Auditoria de Viés (Bias Check):** Implementar um agente "Advogado do Diabo" que tenta encontrar falhas na análise da IA antes da publicação, garantindo neutralidade absoluta.

### 🔴 Eixo C: Infraestrutura e Escalabilidade (6-12 meses)
*   **C.1. Arquitetura de Microserviços:** Separar os agentes em containers independentes para permitir que o Scout busque dados 24/7 sem onerar o servidor de API.
*   **C.2. Banco de Dados Vetorial (RAG):** Implementar um banco vetorial (Pinecone ou Supabase Vector) para armazenar o histórico completo de promessas e permitir buscas semânticas ultra-rápidas.

---

## 3. Métricas de Rigor (KPIs de Sucesso)
Para garantir que o projeto não perca sua essência profissional, cada atualização deve ser medida por:
1.  **Taxa de Precisão de Extração:** > 95% das promessas identificadas devem ser confirmadas por humanos ou fontes oficiais.
2.  **Latência de Auditoria:** O tempo entre a notícia sair e o sistema auditá-la deve ser inferior a 10 minutos.
3.  **Índice de Confiança SICONFI:** O score deve ter correlação direta com a execução orçamentária real do Tesouro Nacional.

---

## 4. Conclusão Realista
O maior desafio não é tecnológico, mas de **curadoria de dados**. O Brasil possui dados públicos abundantes, mas desestruturados. O futuro deste projeto reside na capacidade de ser o "tradutor" entre a burocracia estatal e o entendimento do cidadão, mantendo-se como uma zona neutra de fatos em um ambiente político polarizado.

---
*Este plano é um documento vivo e deve ser revisado trimestralmente.*
