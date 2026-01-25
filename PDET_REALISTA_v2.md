# 🛠️ Plano Diretor de Evolução (v2.0): Realidade de Trincheira

**Foco:** Eficácia, Baixo Custo e Rigor Analítico.  
**Analista:** Seth VII  

Este plano substitui a versão anterior, eliminando complexidades desnecessárias e focando no que realmente faz o **Detector de Promessa Vazia** ser útil e confiável.

---

## 1. Eixo de Curto Prazo: Refino do "Cérebro" e "Olhos" (Execução Imediata)

### 1.1. Filtro de Ruído no Scout (O Fim do Lixo)
*   **Problema:** O Scout às vezes traz notícias de "fofoca política" ou colunas de opinião que não contêm promessas reais.
*   **Solução Realista:** Implementar uma lista de "Palavras Proibidas" (ex: 'BBB', 'festa', 'namoro') e uma verificação de tamanho mínimo de texto antes de enviar para a IA. Isso economiza processamento e limpa o relatório.

### 1.2. Padronização do SICONFI (Transparência Real)
*   **Problema:** O usuário vê "Orçamento: 70%", mas não sabe de onde veio esse número.
*   **Solução Realista:** Adicionar uma pequena tabela abaixo do score mostrando: "Valor Empenhado vs. Valor Liquidado" para a categoria da promessa. São dados que já acessamos, só precisamos exibir melhor.

---

## 2. Eixo de Médio Prazo: Independência e Estabilidade

### 2.1. Sanitização de Texto Pré-IA
*   **Problema:** Enviar HTML sujo ou textos gigantes para a IA causa erros e gasta "tokens" (mesmo sendo grátis, há limites de tempo).
*   **Solução Realista:** Criar uma função simples de `cleanText()` que remove scripts, tags e espaços duplos, enviando apenas o "filé" da notícia para a análise.

### 2.2. Sistema de "Veredito em Duas Etapas"
*   **Problema:** A IA às vezes é otimista demais.
*   **Solução Realista:** O BrainAgent fará duas perguntas internas: 
    1. "Quais são os fatos?" 
    2. "Por que isso pode dar errado?". 
    O relatório final deve obrigatoriamente conter uma seção de **"Riscos de Descumprimento"**.

---

## 3. Eixo de Longo Prazo: Sustentabilidade do Projeto

### 3.1. Exportação para Auditoria (CSV/JSON)
*   **Problema:** Os dados ficam presos no banco de dados.
*   **Solução Realista:** Criar um botão "Exportar Dados Brutos" para que jornalistas ou cidadãos possam baixar a planilha de promessas e fazer suas próprias conferências.

### 3.2. Monitoramento de Saúde das APIs
*   **Problema:** Se a API da Câmara ou do SICONFI cair, o sistema dá erro genérico.
*   **Solução Realista:** Criar um painel simples (ou log) que avisa: "API da Câmara fora do ar - Usando dados históricos".

---

## 4. Por que este plano é Profissional e Realista?
1.  **Custo Zero:** Não exige novas assinaturas ou servidores potentes.
2.  **Manutenível:** Pode ser feito alterando apenas os arquivos atuais (`scout.ts`, `brain.ts`, `AnalysisResults.tsx`).
3.  **Focado no Valor:** Melhora a confiança do usuário no resultado final, que é o objetivo do projeto.

---
*Menos engenharia de software, mais engenharia de dados e transparência.*
