
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAI() {
  console.log('--- Testando Conectividade Real com IAs (Modelos Atualizados) ---');

  // 1. Testar Gemini (Usando v1 em vez de v1beta e modelo estável)
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const resp = await axios.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      contents: [{ parts: [{ text: "Diga 'Gemini OK'" }] }]
    });
    console.log('✅ Gemini:', resp.data.candidates[0].content.parts[0].text.trim());
  } catch (e: any) {
    console.log('❌ Gemini Falhou:', e.response?.data?.error?.message || e.message);
  }

  // 2. Testar Groq (Usando modelo atualizado llama-3.3-70b-versatile)
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const resp = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Diga 'Groq OK'" }]
    }, {
      headers: { 'Authorization': `Bearer ${groqKey}` }
    });
    console.log('✅ Groq:', resp.data.choices[0].message.content.trim());
  } catch (e: any) {
    console.log('❌ Groq Falhou:', e.response?.data?.error?.message || e.message);
  }

  // 3. Testar DeepSeek (Apenas reportar saldo se falhar novamente)
  try {
    const dsKey = process.env.DEEPSEEK_API_KEY;
    const resp = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Diga 'DeepSeek OK'" }]
    }, {
      headers: { 'Authorization': `Bearer ${dsKey}` }
    });
    console.log('✅ DeepSeek:', resp.data.choices[0].message.content.trim());
  } catch (e: any) {
    console.log('❌ DeepSeek Falhou:', e.response?.data?.error?.message || e.message);
  }
}

testAI().catch(console.error);
