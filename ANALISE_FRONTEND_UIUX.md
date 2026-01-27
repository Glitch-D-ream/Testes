
# 🎨 Análise de UI/UX: Seth VII Dashboard

Após analisar o código-fonte do frontend (`client/src`), identifiquei os pontos que tornam a experiência "limitada e rudimentar", conforme relatado.

## 🔴 Limitações Identificadas

### 1. Estética e Design (UI)
*   **Falta de Identidade Visual Forte:** O site usa um padrão muito comum de Tailwind (Slate/Blue). Falta uma personalidade "Forense/Inteligência" que o nome Seth VII sugere.
*   **Layout Monótono:** A Home e o Dashboard são baseados em grids simples. Não há profundidade visual (sombras, gradientes modernos, glassmorphism).
*   **Tipografia:** Uso de fontes padrão sem hierarquia clara de "peso" para dados críticos.

### 2. Experiência do Usuário (UX)
*   **Feedback de Carregamento:** O "carregamento infinito" (que já corrigimos no backend) no frontend é apenas um spinner simples. Falta um Skeleton Screen ou indicadores de progresso dos agentes (ex: "Scout pesquisando...", "Brain analisando...").
*   **Navegação:** O fluxo entre "Busca -> Análise -> Resultados" é linear demais. Não há um dashboard central onde o usuário possa ver tendências globais de forma interativa.
*   **Visualização de Dados:** Gráficos de barras simples não transmitem a complexidade da auditoria. Falta interatividade (hover, filtros, drill-down).

### 3. Funcionalidades Ausentes
*   **Modo Comparativo Real:** Existe um `VersusMode`, mas ele não parece estar integrado de forma fluida na Home.
*   **Histórico Global:** O usuário não consegue ver o que está sendo auditado agora por outras pessoas (Trending).
*   **Dossiê Exportável:** Os botões de PDF e Card estão com `alert('em manutenção')`.

## 🚀 Proposta de Reformulação: "Seth VII - Obsidian Edition"

### Visão Geral
Transformar o site em uma **"Central de Comando Forense"**, com um tema escuro profundo (Obsidian), detalhes em azul neon/ciano e uma interface baseada em cards dinâmicos.

### Mudanças Sugeridas:
1.  **Home "Command Center":** Um campo de busca central que parece um terminal de inteligência, com estatísticas vivas ao redor.
2.  **Live Progress Tracking:** Durante a análise, exibir o status de cada agente (Scout, Filter, Brain) com ícones animados.
3.  **Dashboard de Resultados 2.0:**
    *   Uso de **Glassmorphism** para os painéis de inteligência.
    *   **Radar Charts** interativos para viabilidade.
    *   **Timeline Forense** mais visual para os atos oficiais.
4.  **Integração de Mapas:** Exibir a influência regional (PE, SP, Federal) em um mapa do Brasil interativo.

---
**Próximo Passo:** Vou começar a implementar a nova identidade visual na Home e no Dashboard de Resultados.
