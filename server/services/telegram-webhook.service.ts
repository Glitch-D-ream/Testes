import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { analysisService } from './analysis.service.js';
import { logInfo, logError } from '../core/logger.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN || '';
const WEBHOOK_PATH = '/api/telegram/webhook';

export class TelegramWebhookService {
  private bot: Telegraf | null = null;
  private isWebhookSet = false;

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

    this.bot.help((ctx) => {
      ctx.reply(
        '📖 *Ajuda - Detector de Promessa Vazia*\n\n' +
        '*Como usar:*\n' +
        '1. Envie qualquer texto político (discurso, post, promessa)\n' +
        '2. Aguarde alguns segundos para a análise\n' +
        '3. Receba o resultado com score de viabilidade\n\n' +
        '*Comandos disponíveis:*\n' +
        '/start - Iniciar o bot\n' +
        '/help - Mostrar esta ajuda\n\n' +
        '*Dúvidas?* Entre em contato conosco!',
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      
      // Ignorar comandos
      if (text.startsWith('/')) {
        return;
      }
      
      if (text.length < 20) {
        return ctx.reply('⚠️ O texto é muito curto para uma análise precisa. Tente enviar um parágrafo mais completo.');
      }

      if (text.length > 5000) {
        return ctx.reply('⚠️ O texto é muito longo. Por favor, envie um texto com até 5000 caracteres.');
      }

      ctx.reply('🔍 Analisando promessas... Isso pode levar alguns segundos.');

      try {
        // Realizar análise (usando autor genérico para o bot)
        const result = await analysisService.createAnalysis(
          null, 
          text, 
          'Autor via Telegram', 
          'GERAL'
        );
        
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

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        response += `🔗 *Veja a análise completa:* ${appUrl}/analysis/${result.id}`;
        
        ctx.replyWithMarkdown(response);
        logInfo(`Análise via Telegram concluída: ${result.id}`);
      } catch (error) {
        logError('Erro no Bot de Telegram', error as Error);
        ctx.reply('❌ Desculpe, ocorreu um erro ao processar sua análise. Tente novamente mais tarde.');
      }
    });

    // Handler para outros tipos de mensagem
    this.bot.on('message', (ctx) => {
      ctx.reply('⚠️ Por favor, envie apenas mensagens de texto com o conteúdo político que deseja analisar.');
    });
  }

  /**
   * Configura o webhook do Telegram
   */
  public async setWebhook(): Promise<boolean> {
    if (!this.bot || !WEBHOOK_DOMAIN) {
      logError('Bot de Telegram não configurado', new Error('Token ou domínio ausente'));
      return false;
    }

    try {
      const webhookUrl = `${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
      await this.bot.telegram.setWebhook(webhookUrl, {
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query']
      });
      
      this.isWebhookSet = true;
      logInfo(`Webhook do Telegram configurado: ${webhookUrl}`);
      return true;
    } catch (error) {
      logError('Erro ao configurar webhook do Telegram', error as Error);
      return false;
    }
  }

  /**
   * Remove o webhook do Telegram
   */
  public async deleteWebhook(): Promise<boolean> {
    if (!this.bot) return false;

    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
      this.isWebhookSet = false;
      logInfo('Webhook do Telegram removido');
      return true;
    } catch (error) {
      logError('Erro ao remover webhook do Telegram', error as Error);
      return false;
    }
  }

  /**
   * Obtém informações sobre o webhook atual
   */
  public async getWebhookInfo(): Promise<any> {
    if (!this.bot) return null;

    try {
      const info = await this.bot.telegram.getWebhookInfo();
      return info;
    } catch (error) {
      logError('Erro ao obter info do webhook', error as Error);
      return null;
    }
  }

  /**
   * Processa um update recebido via webhook
   */
  public async handleUpdate(update: Update): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot não inicializado');
    }

    try {
      await this.bot.handleUpdate(update);
    } catch (error) {
      logError('Erro ao processar update do Telegram', error as Error);
      throw error;
    }
  }

  /**
   * Verifica se o bot está configurado
   */
  public isConfigured(): boolean {
    return !!this.bot && !!BOT_TOKEN;
  }

  /**
   * Verifica se o webhook está configurado
   */
  public isWebhookConfigured(): boolean {
    return this.isWebhookSet;
  }

  /**
   * Obtém a instância do bot (para uso em testes)
   */
  public getBot(): Telegraf | null {
    return this.bot;
  }
}

export const telegramWebhookService = new TelegramWebhookService();
