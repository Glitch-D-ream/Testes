# Guia de Deploy Custo Zero para o Detector de Promessa Vazia

Este guia detalha como hospedar o projeto **Detector de Promessa Vazia** utilizando exclusivamente planos gratuitos (Free Tier) de plataformas de nuvem, garantindo que o projeto seja acessível ao público sem custos operacionais.

## 1. Visão Geral da Arquitetura Gratuita

| Componente | Plataforma Gratuita | Função |
| :--- | :--- | :--- |
| **Frontend (React)** | **Vercel** ou **Netlify** | Hospedagem estática e CDN global. |
| **Backend (Node.js)** | **Railway** ou **Render** | Hospedagem do servidor Express/Node.js. |
| **Banco de Dados (PostgreSQL)** | **Supabase** | Banco de dados relacional robusto e escalável. |
| **Cache (Redis)** | **Upstash** | Camada de cache de alta performance. |
| **Inteligência Artificial** | **Google Gemini API** | Análise semântica avançada (Free Tier). |

## 2. Configuração do Banco de Dados (Supabase)

O Supabase oferece um plano gratuito generoso que inclui um banco de dados PostgreSQL.

1.  **Crie uma Conta:** Acesse o [Supabase](https://supabase.com/) e crie uma conta.
2.  **Crie um Novo Projeto:** Crie um novo projeto e anote o **Connection String** do seu banco de dados.
3.  **Variável de Ambiente:** Esta string será sua `DATABASE_URL`. O formato será:
    ```
    DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB_NAME]"
    ```
4.  **Migração do Schema:** Use o **Drizzle Kit** para aplicar o schema do projeto (`server/models/schema.ts`) ao seu novo banco de dados Supabase.

## 3. Configuração do Backend (Railway ou Render)

O backend Node.js será hospedado em um serviço que suporta containers ou Node.js.

1.  **Crie uma Conta:** Acesse o [Railway](https://railway.app/) ou [Render](https://render.com/) e conecte seu repositório GitHub.
2.  **Crie um Novo Serviço:** Crie um novo serviço e aponte para o diretório `server` do seu projeto.
3.  **Variáveis de Ambiente:** Configure as seguintes variáveis de ambiente no painel da plataforma:

| Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Define o ambiente de produção. |
| `DATABASE_URL` | *String de Conexão do Supabase* | Conexão com o PostgreSQL. |
| `GEMINI_API_KEY` | *Sua chave da Gemini API* | Chave para a análise de IA (Provedor Primário). |
| `GROQ_API_KEY` | *Sua chave da Groq API* | Chave para a análise de IA (Provedor Secundário/Fallback). |
| `DEEPSEEK_API_KEY` | *Sua chave da DeepSeek API* | Chave para a análise de IA (Provedor de Alta Qualidade/Fallback). |
| `TELEGRAM_BOT_TOKEN` | *Seu token do BotFather* | Token para o Bot de Telegram. |
| `REDIS_URL` | *URL do Upstash* | Conexão com o serviço de cache. |
| `APP_URL` | *URL pública do seu Frontend* | Necessário para o Bot de Telegram gerar links. |
| `JWT_SECRET` | *String aleatória segura* | Chave secreta para autenticação. |

4.  **Deploy:** O Railway/Render irá automaticamente construir e implantar seu backend.

## 4. Configuração do Cache (Upstash)

O Upstash oferece Redis sem servidor com um plano gratuito.

1.  **Crie uma Conta:** Acesse o [Upstash](https://upstash.com/) e crie um banco de dados Redis.
2.  **Variável de Ambiente:** Copie a URL de conexão e use-a como `REDIS_URL` no seu Backend.

## 5. Configuração do Frontend (Vercel)

O Vercel é ideal para hospedar o frontend React/Vite.

1.  **Crie uma Conta:** Acesse o [Vercel](https://vercel.com/) e conecte seu repositório GitHub.
2.  **Importe o Projeto:** Importe o projeto e configure o diretório de build para `client`.
3.  **Configuração de Build:** O Vercel deve detectar automaticamente que é um projeto Vite.
4.  **Deploy:** O Vercel fará o deploy do seu frontend.

## 6. Configuração do Bot de Telegram

1.  **Obtenha o Token:** Fale com o **BotFather** no Telegram para criar seu bot e obter o `TELEGRAM_BOT_TOKEN`.
2.  **Webhook (Opcional):** Se você não estiver usando o Railway/Render com Webhooks, você precisará configurar o Webhook do Telegram para apontar para a URL pública do seu Backend.

## 7. Próximos Passos Pós-Deploy

1.  **Executar o Seed:** Após o deploy do Backend e a migração do banco, execute o script `scripts/seed_real_data.ts` manualmente para popular o banco com dados iniciais.
2.  **Testes:** Teste o formulário de análise, o dashboard e o Bot de Telegram.

Com este guia, você terá uma arquitetura robusta, escalável e **totalmente gratuita** para lançar o **Detector de Promessa Vazia** para o público.
