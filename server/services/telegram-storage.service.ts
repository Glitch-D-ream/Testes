
import { Telegraf } from 'telegraf';
import { runQuery } from '../core/database.js';
import { nanoid } from 'nanoid';

export class TelegramStorageService {
  private bot: Telegraf;
  private chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.bot = new Telegraf(token);
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  /**
   * Registra uma prova no banco de dados vinculada ao Telegram
   */
  async registerEvidence(params: {
    politicianId: string;
    analysisId?: string;
    fileId: string;
    fileType: 'image' | 'pdf' | 'video';
    description: string;
  }) {
    const id = nanoid();
    
    try {
      await runQuery(
        'INSERT INTO evidence_storage (id, politician_id, analysis_id, telegram_file_id, file_type, description) VALUES (?, ?, ?, ?, ?, ?)',
        [id, params.politicianId, params.analysisId || null, params.fileId, params.fileType, params.description]
      );
      console.log(`[TelegramStorage] Prova ${params.fileId} vinculada ao político ${params.politicianId}`);
    } catch (error) {
      console.error('[TelegramStorage] Erro ao registrar evidência:', error);
    }
    
    return {
      id,
      ...params,
      createdAt: new Date()
    };
  }

  /**
   * Gera um link de visualização (via bot ou proxy)
   */
  getEvidenceUrl(fileId: string) {
    return `https://t.me/seu_bot_proxy?file_id=${fileId}`;
  }
}

export const telegramStorage = new TelegramStorageService();
