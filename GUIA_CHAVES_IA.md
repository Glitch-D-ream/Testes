# Guia: Como Obter Chaves de IA Gratuitas para o Projeto

Para que o **Detector de Promessa Vazia** funcione com precisão, ele utiliza modelos de IA para extrair promessas. Abaixo estão os passos para obter chaves funcionais nos provedores que já estão integrados ao seu código.

---

## 1. Google Gemini (Recomendado)
O Gemini 1.5 Flash é excelente para português e possui um plano gratuito generoso.

1.  Acesse o [Google AI Studio](https://aistudio.google.com/).
2.  Faça login com sua conta Google.
3.  No menu lateral, clique em **"Get API key"**.
4.  Clique em **"Create API key in new project"**.
5.  **Importante:** Certifique-se de copiar a chave completa (começa com `AIza...`).
6.  *Limite:* 15 requisições por minuto (grátis).

## 2. Groq Cloud (O mais rápido)
O Groq oferece acesso gratuito a modelos como Llama 3 e Mixtral com velocidade impressionante.

1.  Acesse o [Groq Console](https://console.groq.com/).
2.  Crie uma conta ou faça login.
3.  Vá na seção **"API Keys"**.
4.  Clique em **"Create API Key"**.
5.  Dê um nome (ex: "Detector-Railway") e copie a chave (começa com `gsk_...`).

## 3. DeepSeek (Alta Qualidade)
O DeepSeek é muito eficiente para raciocínio lógico e extração de dados.

1.  Acesse o [DeepSeek Platform](https://platform.deepseek.com/).
2.  Crie sua conta.
3.  Vá em **"API Keys"**.
4.  Clique em **"Create new API key"**.
5.  **Nota:** O DeepSeek costuma dar um saldo inicial gratuito (ex: $2 ou $5) para novos usuários, o que dura milhares de análises.

---

## 💡 Recomendações de IAs Gratuitas Alternativas

Se você preferir usar apenas um provedor estável, recomendo focar no **Google Gemini**, pois ele não exige cartão de crédito para o nível gratuito e tem o melhor suporte para a língua portuguesa entre os modelos "small".

### Como testar se sua chave está ativa:
Antes de colocar no Railway, você pode testar rapidamente via terminal (substitua `SUA_CHAVE`):

**Para Gemini:**
```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=SUA_CHAVE \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{"text": "Olá, responda apenas OK."}]
      }]
    }'
```

---

## 🛠️ Próximos Passos
Assim que você obtiver as novas chaves, basta atualizá-las no painel de **Variables** do seu projeto no Railway. O sistema detectará a mudança automaticamente.
