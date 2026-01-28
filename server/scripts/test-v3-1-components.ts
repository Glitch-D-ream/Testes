
import { camaraApiService } from '../services/camara-api.service.ts';
import { aiService } from '../services/ai.service.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testComponents() {
  logInfo("🧪 Testando Componentes Seth VII v3.1");

  // 1. Teste API Câmara
  try {
    const id = await camaraApiService.findDeputadoId("Erika Hilton");
    if (id) {
      logInfo(`✅ API Câmara: ID ${id} encontrado.`);
      const discursos = await camaraApiService.getDiscursos(id);
      logInfo(`✅ API Câmara: ${discursos.length} discursos recuperados.`);
    } else {
      logError("❌ API Câmara: ID não encontrado.", new Error("Not Found"));
    }
  } catch (e) {
    logError("❌ API Câmara: Falha crítica.", e as Error);
  }

  // 2. Teste Prompt Adversarial (IA)
  try {
    const testText = "Erika Hilton promete lutar pelos direitos da comunidade LGBTQIA+ e por moradia digna.";
    const analysis = await aiService.analyzeText(testText);
    logInfo("✅ AI Service: Resposta estruturada recebida.");
    console.log("Veredito IA (Amostra):", JSON.stringify(analysis.promises[0], null, 2));
  } catch (e) {
    logError("❌ AI Service: Falha na integração.", e as Error);
  }

  process.exit(0);
}

testComponents();
