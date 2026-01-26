# 🚀 Relatório de Melhoria: Scout & Filter Agent (v2.1)

Implementamos uma série de melhorias para expandir as capacidades de coleta e análise de dados do **Seth VII**, focando em portais de notícias, entrevistas e registros jurídicos.

---

## 1. Expansão do Scout Agent (Notícias e Entrevistas)

O Scout agora é capaz de realizar buscas profundas e extrair conteúdos completos de grandes portais de notícias brasileiros.

### ✅ O que mudou:
- **Scraping Profundo:** O `ContentScraper` foi aprimorado com seletores específicos para **G1, Folha, Estadão, CNN Brasil, Metrópoles e Poder360**.
- **Detecção de Entrevistas:** Nova lógica para identificar formatos de pergunta/resposta e alta densidade de aspas, priorizando transcrições de entrevistas.
- **Buscas Especializadas:** O `ScoutHybrid` agora executa 4 buscas paralelas:
  1. Fontes Oficiais (Câmara/Senado)
  2. Notícias Gerais (Google News RSS)
  3. Entrevistas e Declarações (Query focada em "entrevista", "declarou", "anunciou")
  4. Registros Jurídicos (Query focada em "processo judicial", "investigação", "tribunal")

---

## 2. Aprimoramento do Filter Agent

O filtro foi recalibrado para suportar o novo volume de dados e garantir que apenas informações relevantes sejam enviadas ao Brain.

### ✅ O que mudou:
- **Whitelist de Elite:** Adição de domínios de alta confiança (JusBrasil, ConJur, BBC, etc.) com critérios de filtragem mais flexíveis.
- **Valorização de Evidências:** Novo sistema que identifica e valoriza conteúdos com aspas diretas e termos jurídicos.
- **Camadas de Credibilidade:** Notícias de portais de elite agora são automaticamente classificadas como **Camada B**, garantindo peso adequado na análise final.

---

## 3. Integração Jurídica (JusBrasil & Querido Diário)

Devido às restrições da API oficial do JusBrasil, implementamos uma abordagem híbrida de alta eficiência.

### ✅ Solução Implementada:
- **Scraping de Busca Jurídica:** O sistema agora busca ativamente por links do **JusBrasil** e **ConJur** via Scout, extraindo o conteúdo público desses portais.
- **API Querido Diário:** Integração com a API do projeto Querido Diário (Open Knowledge Brasil) para buscar menções em **Diários Oficiais** de municípios brasileiros.
- **Perfil Jurídico:** O Brain agora recebe dados de processos e investigações, permitindo criar um perfil de integridade mais completo.

---

## 🛠️ Novos Arquivos e Scripts

- `server/integrations/jusbrasil-alternative.ts`: Protótipo de integração jurídica.
- `server/scripts/test-scout-enhanced.ts`: Script para validar as novas capacidades.
- `IMPROVEMENT_PLAN_SCOUT_FILTER.md`: Plano detalhado de implementação.

---

## 📊 Impacto Esperado
- **Enriquecimento de Dados:** Aumento de ~40% na quantidade de promessas e declarações identificadas.
- **Precisão:** Melhor identificação de aspas diretas, reduzindo interpretações errôneas da IA.
- **Integridade:** Inclusão de contexto jurídico e investigativo nos perfis dos políticos.

---

**Assinado:** Seth VII  
**Data:** 26 de Janeiro de 2026
