# 🚀 Plano Mestre de Evolução: Detector de Promessa Vazia

Este documento detalha os próximos passos críticos para transformar o **Detector de Promessa Vazia** na ferramenta de auditoria política mais avançada do Brasil. O sistema já possui a base técnica (Vercel + Supabase + Integrações), e este roteiro foca em **Inteligência de Dados** e **Experiência do Usuário**.

---

## 📊 Fase 1: Dashboard Visual e Transparência de Dados
**Objetivo:** Tornar os dados do Supabase visíveis e compreensíveis para o cidadão comum.

### 1.1 Painel de Estatísticas Dinâmico
- **Gráfico de Pizza:** Distribuição de promessas por categoria (Saúde, Educação, etc.).
- **Ranking de Viabilidade:** Lista de políticos com os melhores e piores scores médios.
- **Mapa de Calor:** Visualização de gastos por estado (usando dados do Portal da Transparência).
- **Tecnologias:** `Recharts` ou `Chart.js` integrados ao frontend React.

### 1.2 Feed de Análises Recentes
- Criar uma página pública de "Últimas Descobertas" para incentivar o compartilhamento viral.
- Implementar busca e filtros por nome de político ou partido.

---

## 🧠 Fase 2: Inteligência de Auditoria (Deep Data)
**Objetivo:** Aprofundar o cruzamento de dados para que o score seja incontestável.

### 2.1 Integração SICONFI Avançada
- **O que falta:** Mapear os códigos de subfunção orçamentária para cada categoria de promessa.
- **Ação:** Criar um script que compare o valor estimado de uma obra (ex: custo médio de um hospital) com o saldo disponível na conta do ente federativo.

### 2.2 Verificação de "Promessas Recicladas"
- **Lógica:** Usar busca vetorial (Vector Search no Supabase) para identificar se um político está repetindo a mesma promessa de 4 ou 8 anos atrás que nunca foi cumprida.

---

## 📱 Fase 3: Expansão de Canais e Engajamento
**Objetivo:** Levar a ferramenta para onde o debate político acontece.

### 3.1 Super Bot do Telegram
- **Comando `/comparar`:** Permitir comparar as promessas de dois candidatos lado a lado.
- **Alertas de Orçamento:** Notificar usuários quando um orçamento de uma área crítica (ex: Educação) sofrer cortes que afetem promessas analisadas.

### 3.2 Gerador de Relatórios PDF (Shareability)
- Implementar a biblioteca `jspdf` no frontend.
- Gerar um "Certificado de Viabilidade" ou "Selo de Promessa Vazia" com QR Code para verificação no site.

---

## 🛠️ Fase 4: Infraestrutura e Sustentabilidade
**Objetivo:** Garantir que o sistema aguente picos de tráfego (ex: períodos eleitorais).

### 4.1 Otimização de Cache
- Implementar Redis (via Upstash) para cache de respostas de IA, reduzindo custos de API e tempo de resposta.

### 4.2 Sistema de Moderação e Contestação
- Criar um fluxo onde assessores de políticos possam enviar documentos para contestar um score baixo, promovendo o debate democrático.

---

## 📝 Guia de Implementação para a Próxima IA/Dev
1. **Variáveis de Ambiente:** Certifique-se de que `DATABASE_URL`, `GEMINI_API_KEY`, `GROQ_API_KEY` e `TELEGRAM_BOT_TOKEN` estão corretas no Vercel.
2. **Banco de Dados:** O schema já está no Supabase. Use as funções `savePublicDataCache` e `getPublicDataCache` em `server/core/database.ts` para qualquer nova integração.
3. **Deploy:** O projeto está configurado como SPA no Vercel. Qualquer alteração no servidor deve ser feita na pasta `api/` para refletir em produção.

---
*Documento gerado em 22 de Janeiro de 2026.*
