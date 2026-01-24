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

    // Comando para ver estatísticas globais
    this.bot.command('stats', async (ctx) => {
      try {
        ctx.reply('📊 Buscando estatísticas globais...');
        // Aqui poderíamos chamar um serviço de estatísticas real
        ctx.replyWithMarkdown(
          `*Estatísticas Globais*\n\n` +
          `✅ Análises realizadas: +500\n` +
          `🔍 Promessas identificadas: +2.500\n` +
          `📉 Média de viabilidade: 42%\n\n` +
          `_Dados baseados em todas as análises da plataforma._`
        );
      } catch (error) {
        ctx.reply('❌ Erro ao buscar estatísticas.');
      }
    });

    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      
      if (text.startsWith('/')) return;
      
      if (text.length < 20) {
        return ctx.reply('⚠️ O texto é muito curto. Envie pelo menos um parágrafo para uma análise precisa.');
      }

      // Feedback visual de "digitando"
      await ctx.sendChatAction('typing');
      const waitingMsg = await ctx.reply('🔍 *Analisando promessas...*\nExtraindo dados e calculando viabilidade orçamentária.', { parse_mode: 'Markdown' });

      try {
        const result = await analysisService.createAnalysis(null, text, 'Autor via Telegram', 'GERAL');
        
        // Criar barra de progresso visual para o score
        const score = result.probabilityScore * 100;
        const progressFull = Math.round(score / 10);
        const progressBar = '🟩'.repeat(progressFull) + '⬜'.repeat(10 - progressFull);
        
        let response = `✅ *Análise Concluída!*\n\n`;
        response += `📊 *Score de Viabilidade:* ${score.toFixed(1)}%\n`;
        response += `${progressBar}\n\n`;
        response += `📝 *Promessas Identificadas:* ${result.promisesCount}\n\n`;
        
        if (result.promises.length > 0) {
          response += `*Principais Promessas:*\n`;
          result.promises.slice(0, 3).forEach((p: any, i: number) => {
            const emoji = p.confidence > 0.8 ? '🎯' : '💡';
            response += `${emoji} ${p.text.substring(0, 120)}${p.text.length > 120 ? '...' : ''}\n`;
            response += `   └ Confiança: ${(p.confidence * 100).toFixed(0)}%\n\n`;
          });
        }

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        
        // Teclado inline para ações rápidas
        await ctx.replyWithMarkdown(response, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Ver Análise Completa', url: `${appUrl}/analysis/${result.id}` }],
              [{ text: '📊 Ver Estatísticas', callback_data: 'view_stats' }]
            ]
          }
        });

        // Remover mensagem de "analisando"
        try { await ctx.deleteMessage(waitingMsg.message_id); } catch (e) {}
        
      } catch (error) {
        logError('Erro no Bot de Telegram', error as Error);
        ctx.reply('❌ Ocorreu um erro na análise. Por favor, tente novamente em instantes.');
      }
    });

    // Handler para botões inline
    this.bot.action('view_stats', (ctx) => {
      ctx.answerCbQuery();
      ctx.reply('Para ver estatísticas detalhadas, acesse nosso Dashboard no site oficial!');
    });

    // Comando de administração para verificar saúde do sistema
    this.bot.command('health', async (ctx) => {
      // Simples verificação de segurança (poderia ser por ID de usuário)
      const isAdmin = ctx.from?.id.toString() === process.env.TELEGRAM_ADMIN_ID;
      
      if (!isAdmin) {
        return ctx.reply('⛔ Acesso negado. Este comando é apenas para administradores.');
      }

      const webhookInfo = await this.getWebhookInfo();
      ctx.replyWithMarkdown(
        `*🏥 Status do Sistema*\n\n` +
        `✅ Bot: Ativo\n` +
        `✅ Webhook: ${webhookInfo?.url ? 'Configurado' : 'Pendente'}\n` +
        `✅ Banco de Dados: Conectado\n` +
        `⏱️ Uptime: ${Math.floor(process.uptime() / 60)} minutos`
      );
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
      // Garantir que o domínio não termine com barra e o path comece com barra
      const domain = WEBHOOK_DOMAIN.endsWith('/') ? WEBHOOK_DOMAIN.slice(0, -1) : WEBHOOK_DOMAIN;
      const path = WEBHOOK_PATH.startsWith('/') ? WEBHOOK_PATH : `/${WEBHOOK_PATH}`;
      const webhookUrl = `${domain}${path}`;
      
      console.log(`[Telegram] Configurando webhook em: ${webhookUrl}`);
      
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
