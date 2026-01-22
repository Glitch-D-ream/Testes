
import { db } from '../core/database.js';
import { politicians, analyses, promises } from '../models/schema.js';
import { ilike, or, sql } from 'drizzle-orm';

export class SearchService {
  /**
   * Busca políticos por nome, partido ou região
   */
  async searchPoliticians(query: string) {
    return await db.select()
      .from(politicians)
      .where(
        or(
          ilike(politicians.name, `%${query}%`),
          ilike(politicians.party, `%${query}%`),
          ilike(politicians.region, `%${query}%`)
        )
      )
      .limit(10);
  }

  /**
   * Busca promessas por palavra-chave ou categoria
   */
  async searchPromises(query: string) {
    return await db.select()
      .from(promises)
      .where(
        or(
          ilike(promises.promiseText, `%${query}%`),
          ilike(promises.category, `%${query}%`)
        )
      )
      .limit(20);
  }

  /**
   * Busca global (Políticos + Promessas)
   */
  async globalSearch(query: string) {
    const [foundPoliticians, foundPromises] = await Promise.all([
      this.searchPoliticians(query),
      this.searchPromises(query)
    ]);

    return {
      politicians: foundPoliticians,
      promises: foundPromises
    };
  }
}

export const searchService = new SearchService();
