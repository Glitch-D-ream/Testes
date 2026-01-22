import { Telegraf } from 'telegraf';
import { analysisService } from './analysis.service.js';
import { logInfo, logError } from '../core/logger.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export class TelegramService {
  private bot: Telegraf | null = null;

  constructor() {
    if (BOT_TOKEN) {
      this.bot = new Telegraf(BOT_TOKEN);
      this.setupHandlers();
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    this.bot.start((ctx) => {
      ctx.reply(
        '👋 Bem-vindo ao Detector de Promessa Vazia!\n\n' +
        'Envie um texto, discurso ou postagem de um político e eu analisarei a viabilidade das promessas para você.\n\n' +
        'Como usar:\n' +
        '1. Cole o texto aqui\n' +
        '2. Aguarde a análise da nossa IA\n' +
        '3. Receba o score de viabilidade instantaneamente!'
      );
    });

    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      
      if (text.length < 20) {
        return ctx.reply('⚠️ O texto é muito curto para uma análise precisa. Tente enviar um parágrafo mais completo.');
      }

      ctx.reply('🔍 Analisando promessas... Isso pode levar alguns segundos.');

      try {
        // Realizar análise (usando autor genérico para o bot)
        const result = await analysisService.createAnalysis(null, text, 'Autor via Telegram', 'GERAL');
        
        let response = `✅ *Análise Concluída!*\n\n`;
        response += `📊 *Score de Viabilidade:* ${(result.probabilityScore * 100).toFixed(1)}%\n`;
        response += `📝 *Promessas Identificadas:* ${result.promisesCount}\n\n`;
        
        if (result.promises.length > 0) {
          response += `*Principais Promessas:*\n`;
          result.promises.slice(0, 3).forEach((p: any, i: number) => {
            response += `${i + 1}. ${p.text.substring(0, 100)}${p.text.length > 100 ? '...' : ''}\n`;
            response += `   └ Confiança: ${(p.confidence * 100).toFixed(0)}%\n\n`;
          });
        }

        response += `🔗 *Veja a análise completa:* ${process.env.APP_URL || 'http://localhost:3000'}/analysis/${result.id}`;
        
        ctx.replyWithMarkdown(response);
      } catch (error) {
        logError('Erro no Bot de Telegram', error as Error);
        ctx.reply('❌ Desculpe, ocorreu um erro ao processar sua análise. Tente novamente mais tarde.');
      }
    });
  }

  public start() {
    if (this.bot) {
      this.bot.launch();
      logInfo('Bot de Telegram iniciado com sucesso');
    } else {
      logInfo('Bot de Telegram não iniciado (Token ausente)');
    }
  }
}

export const telegramService = new TelegramService();
