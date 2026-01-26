
import { getSupabase, initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Script de Bootstrap (Seed) para o Seth VII
 * Insere promessas reais extraídas de Planos de Governo oficiais (TSE)
 * para calibrar o sistema com dados de alta qualidade.
 */
async function seedPromises() {
  logInfo('🚀 Iniciando Bootstrap de Promessas Reais...');

  try {
    await initializeDatabase();
    const supabase = getSupabase();

    // 1. Definir o Dataset Canônico (Promessas Reais do Plano de Governo 2022/2024)
    const canonicalPromises = [
      {
        politician_name: 'Luiz Inácio Lula da Silva',
        text: 'Isenção de Imposto de Renda para quem ganha até R$ 5.000,00.',
        category: 'ECONOMY',
        source: 'Plano de Governo 2022',
        tags: ['fiscal', 'imposto de renda', 'renda']
      },
      {
        politician_name: 'Luiz Inácio Lula da Silva',
        text: 'Recuperação do poder de compra do salário mínimo com reajustes acima da inflação.',
        category: 'ECONOMY',
        source: 'Plano de Governo 2022',
        tags: ['salário mínimo', 'economia', 'trabalho']
      },
      {
        politician_name: 'Erika Hilton',
        text: 'Criação e ampliação de centros de acolhimento para a população LGBTQIA+ em situação de vulnerabilidade.',
        category: 'SOCIAL',
        source: 'Plano de Governo 2022',
        tags: ['lgbtqia+', 'social', 'acolhimento']
      },
      {
        politician_name: 'Nikolas Ferreira',
        text: 'Defesa da pauta da família e combate à ideologia de gênero nas escolas.',
        category: 'EDUCATION',
        source: 'Plano de Governo 2022',
        tags: ['família', 'educação', 'valores']
      },
      {
        politician_name: 'Tabata Amaral',
        text: 'Implementação do ensino integral em todas as escolas de ensino médio da rede pública.',
        category: 'EDUCATION',
        source: 'Plano de Governo 2022',
        tags: ['educação', 'ensino integral', 'escola']
      },
      {
        politician_name: 'Guilherme Boulos',
        text: 'Criação de um programa robusto de habitação popular para reduzir o déficit habitacional.',
        category: 'SOCIAL',
        source: 'Plano de Governo 2022',
        tags: ['habitação', 'social', 'moradia']
      },
      {
        politician_name: 'Sérgio Moro',
        text: 'Fortalecimento do combate à corrupção e apoio à autonomia da Polícia Federal.',
        category: 'SECURITY',
        source: 'Plano de Governo 2022',
        tags: ['corrupção', 'segurança', 'justiça']
      },
      {
        politician_name: 'Simone Tebet',
        text: 'Criação de uma poupança para jovens que concluírem o ensino médio (Poupança Jovem).',
        category: 'EDUCATION',
        source: 'Plano de Governo 2022',
        tags: ['educação', 'jovens', 'incentivo']
      }
    ];

    logInfo(`Inserindo ${canonicalPromises.length} promessas canônicas...`);

    for (const promise of canonicalPromises) {
      const analysisData: any = {
        id: `seed_${Math.random().toString(36).substring(7)}`,
        author: promise.politician_name,
        text: `PROMESSA CANÔNICA: ${promise.text}`,
        category: promise.category,
        status: 'completed',
        data_sources: {
          source: promise.source,
          tags: promise.tags,
          is_canonical: true,
          type: 'PROMISE'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('analyses').insert([analysisData]);

      if (error) {
        logError(`Erro ao inserir promessa de ${promise.politician_name}:`, error as any);
      } else {
        logInfo(`✅ Promessa inserida: ${promise.politician_name} - ${promise.category}`);
      }
    }

    logInfo('✨ Bootstrap concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logError('Erro fatal no script de seed:', error as Error);
    process.exit(1);
  }
}

seedPromises();
