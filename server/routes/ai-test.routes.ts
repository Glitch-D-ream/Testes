import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai.service.ts';
import { logInfo, logError } from '../core/logger.ts';

const router = Router();

router.get('/test', async (req: Request, res: Response) => {
  const sampleText = "Prometo construir 10 escolas e reduzir impostos municipais em 20% até o final do mandato.";
  const results: any = {};

  logInfo('Iniciando teste de IAs via endpoint...');

  try {
    // Teste individual para cada provedor se a chave existir
    if (process.env.GEMINI_API_KEY) {
      try {
        results.gemini = await (aiService as any).analyzeWithGemini(sampleText);
      } catch (e: any) {
        results.gemini = { error: e.message };
      }
    }

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        results.deepseek = await (aiService as any).analyzeWithDeepSeek(sampleText);
      } catch (e: any) {
        results.deepseek = { error: e.message };
      }
    }

    if (process.env.GROQ_API_KEY) {
      try {
        results.groq = await (aiService as any).analyzeWithGroq(sampleText);
      } catch (e: any) {
        results.groq = { error: e.message };
      }
    }

    res.json({
      success: true,
      env: {
        hasGemini: !!process.env.GEMINI_API_KEY,
        hasDeepSeek: !!process.env.DEEPSEEK_API_KEY,
        hasGroq: !!process.env.GROQ_API_KEY
      },
      results
    });
  } catch (error: any) {
    logError('Erro no teste de IA', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
