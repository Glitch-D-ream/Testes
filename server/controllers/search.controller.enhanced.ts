/**
 * Controlador de Busca Aprimorado com Contexto
 * Processa buscas com informações adicionais (cargo, estado, cidade, partido)
 */

import { Request, Response } from 'express';
import { getSupabase } from '../core/database.ts';
import { logError, logInfo } from '../core/logger.ts';
import { searchService } from '../services/search.service.ts';

export interface ContextualSearchRequest {
  name: string;
  office?: string;
  state?: string;
  city?: string;
  party?: string;
}

export class SearchControllerEnhanced {
  /**
   * Busca contextualizada de políticos com filtros
   */
  async contextualSearch(req: Request, res: Response) {
    try {
      const { name, office, state, city, party } = req.body as ContextualSearchRequest;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome do político é obrigatório' });
      }

      logInfo(`[Controller] Busca contextualizada: ${name} | Cargo: ${office} | Estado: ${state} | Cidade: ${city} | Partido: ${party}`);

      const userId = (req as any).userId || null;
      
      // Chamar o serviço de busca com contexto
      const result = await searchService.contextualAutoAnalyze(
        {
          name: name.trim(),
          office: office?.trim() || undefined,
          state: state?.trim() || undefined,
          city: city?.trim() || undefined,
          party: party?.trim() || undefined
        },
        userId
      );
      
      return res.status(202).json(result); // 202 Accepted
    } catch (error) {
      logError('Erro na busca contextualizada', error as Error);
      return res.status(500).json({ 
        error: 'Erro ao realizar busca contextualizada',
        message: (error as Error).message 
      });
    }
  }

  /**
   * Sugestões de políticos baseado em contexto parcial
   * Útil para autocomplete/sugestões enquanto o usuário digita
   */
  async suggestPoliticians(req: Request, res: Response) {
    try {
      const { name, office, state } = req.query;
      const supabase = getSupabase();

      if (!name || name.toString().length < 2) {
        return res.json({ suggestions: [] });
      }

      // Construir query dinâmica baseada no contexto
      let query = supabase
        .from('politicians')
        .select('id, name, office, party, region')
        .ilike('name', `%${name}%`);

      if (office) {
        query = query.ilike('office', `%${office}%`);
      }

      if (state) {
        query = query.eq('region', state.toString().toUpperCase());
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      return res.json({
        suggestions: (data || []).map(p => ({
          id: p.id,
          name: p.name,
          office: p.office,
          party: p.party,
          state: p.region
        }))
      });
    } catch (error) {
      logError('Erro ao gerar sugestões', error as Error);
      return res.status(500).json({ error: 'Erro ao gerar sugestões' });
    }
  }

  /**
   * Busca avançada com múltiplos filtros
   */
  async advancedSearch(req: Request, res: Response) {
    try {
      const { name, office, state, city, party, minConfidence = 0 } = req.body;
      const supabase = getSupabase();

      logInfo(`[Controller] Busca avançada com filtros: ${JSON.stringify({ name, office, state, city, party })}`);

      // Buscar análises que correspondem aos critérios
      let query = supabase
        .from('analyses')
        .select('id, author, probability_score, created_at, text');

      // Filtro por nome do político
      if (name) {
        query = query.ilike('author', `%${name}%`);
      }

      // Filtro por score de confiança
      if (minConfidence > 0) {
        query = query.gte('probability_score', minConfidence);
      }

      const { data: analyses, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (error) throw error;

      // Pós-processamento para filtrar por contexto adicional
      let results = analyses || [];

      // Se houver filtros de contexto, aplicar heurística
      if (office || state || city || party) {
        results = results.filter(a => {
          const text = (a.text || '').toLowerCase();
          const author = (a.author || '').toLowerCase();

          let matches = 0;
          let totalFilters = 0;

          if (office) {
            totalFilters++;
            if (text.includes(office.toLowerCase()) || author.includes(office.toLowerCase())) {
              matches++;
            }
          }

          if (state) {
            totalFilters++;
            if (text.includes(state.toUpperCase()) || text.includes(state.toLowerCase())) {
              matches++;
            }
          }

          if (city) {
            totalFilters++;
            if (text.includes(city.toLowerCase())) {
              matches++;
            }
          }

          if (party) {
            totalFilters++;
            if (text.includes(party.toUpperCase()) || text.includes(party.toLowerCase())) {
              matches++;
            }
          }

          // Retornar se houver pelo menos 50% de match nos filtros fornecidos
          return totalFilters === 0 || matches >= Math.ceil(totalFilters * 0.5);
        });
      }

      return res.json({
        results: results.map(a => ({
          id: a.id,
          author: a.author,
          score: a.probability_score,
          createdAt: a.created_at,
          preview: a.text?.substring(0, 200)
        }))
      });
    } catch (error) {
      logError('Erro na busca avançada', error as Error);
      return res.status(500).json({ error: 'Erro ao realizar busca avançada' });
    }
  }
}

export const searchControllerEnhanced = new SearchControllerEnhanced();
