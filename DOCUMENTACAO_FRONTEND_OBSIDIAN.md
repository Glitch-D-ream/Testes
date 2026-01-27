
# 🌌 Seth VII - Obsidian UI/UX Architecture

O frontend do Seth VII foi completamente reformulado para refletir a autoridade e a profundidade de uma plataforma de **Auditoria Forense**. A nova identidade visual, codinome **Obsidian**, abandona o visual genérico e adota uma estética de "Central de Comando".

## 🛠️ Stack Visual
*   **Base:** Tailwind CSS v4 (Obsidian Dark Theme)
*   **Componentes:** Framer Motion (Animações), Lucide React (Ícones)
*   **Estética:** Glassmorphism, Neon Borders, Typography Hierarchies

## 💎 Principais Mudanças

### 1. Home (Command Center)
*   **Hero Section:** Tipografia massiva com gradientes ciano/azul.
*   **Search Engine:** O campo de busca agora é o ponto focal, com feedback visual de "Zap" (Auditoria) e polling de agentes com progresso detalhado.
*   **Background:** Gradientes radiais dinâmicos e grid de partículas para profundidade.

### 2. Dashboard de Resultados (Forensic Dossiê)
*   **ForensicResultCard:** Novo componente que centraliza o "Veredito Fiscal" e o "Score de Credibilidade" em um card de alta fidelidade.
*   **Intelligence Panels:** Todos os painéis (Vulnerabilidade, Benchmarking, Consenso) agora usam o estilo Glassmorphism.
*   **Rastreabilidade:** Nova seção visual para projetos da Câmara e dados do SICONFI.

### 3. Estatísticas Globais
*   **StatCards:** Cards minimalistas com ícones de inteligência.
*   **Data Visualization:** Barras de progresso com gradientes e animações de entrada (Ease-out).

## 🚀 Impacto na UX
*   **Fim do Carregamento Infinito Visual:** O usuário agora vê exatamente o que cada agente (Scout, Brain, Ironclad) está fazendo em tempo real.
*   **Percepção de Valor:** O design escuro e técnico aumenta a percepção de que os dados são auditados e confiáveis.
*   **Responsividade:** Mantida a compatibilidade total com dispositivos móveis.

---
**Status:** Implementado e pronto para deploy.
