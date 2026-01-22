
import axios from 'axios';
import { runQuery, getQuery } from '../core/database.js';
import { nanoid } from 'nanoid';
import { logInfo, logError } from '../core/logger.js';

export class ImportService {
  /**
   * Busca um político na API da Câmara e importa se não existir
   */
  async importFromCamara(name: string) {
    logInfo(`[Import] Buscando "${name}" na API da Câmara...`);
    
    try {
      const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(name)}`);
      const results = response.data.dados;

      if (!results || results.length === 0) {
        return null;
      }

      const camaraData = results[0]; // Pega o primeiro resultado
      
      // Verificar se já existe no nosso banco
      const existing = await getQuery('SELECT id FROM politicians WHERE tse_id = ?', [camaraData.id.toString()]);
      
      if (existing) {
        logInfo(`[Import] Político ${camaraData.nome} já existe no banco.`);
        return existing.id;
      }

      // Importar novo político
      const id = nanoid();
      await runQuery(
        'INSERT INTO politicians (id, name, party, office, region, tse_id, photo_url, bio, credibility_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          camaraData.nome,
          camaraData.siglaPartido,
          'Deputado Federal',
          camaraData.siglaUf,
          camaraData.id.toString(),
          camaraData.urlFoto,
          `Deputado Federal em exercício (Legislatura ${camaraData.idLegislatura}). Dados importados da Câmara dos Deputados.`,
          50 // Score inicial neutro
        ]
      );

      logInfo(`[Import] ✅ ${camaraData.nome} importado com sucesso!`);
      return id;
    } catch (error) {
      logError('[Import] Erro ao importar da Câmara', error as Error);
      return null;
    }
  }
}

export const importService = new ImportService();
