
import axios from 'axios';
import { logInfo, logWarn, logError } from '../core/logger.ts';

export interface LegalRecord {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  date?: string;
  content?: string;
}

export class JusBrasilAlternative {
  private readonly DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
  private readonly TRIBUNALS = ['tjsp', 'trf3', 'trf1', 'tst', 'tse'];

  /**
   * Busca real via API Pública do Datajud (CNJ)
   */
  private async searchDatajud(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[Datajud] Iniciando busca oficial para: ${politicianName}`);
    const records: LegalRecord[] = [];

    for (const tribunal of this.TRIBUNALS) {
      try {
        const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
        const payload = {
          "query": {
            "bool": {
              "should": [
                { "match": { "partes.nome": politicianName } },
                { "match_phrase": { "partes.nome": politicianName } }
              ]
            }
          },
          "size": 3
        };

        const response = await axios.post(url, payload, {
          headers: {
            'Authorization': `ApiKey ${this.DATAJUD_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        const hits = response.data.hits?.hits || [];
        for (const hit of hits) {
          const p = hit._source;
          records.push({
            title: `Processo ${p.numeroProcesso} - ${p.classe?.nome || 'Judicial'}`,
            url: `https://pje.jus.br/consultapublica/DetalheProcessoConsultaPublica/listView.seam?ca=${p.numeroProcesso}`,
            excerpt: `Órgão: ${p.orgaoJulgador?.nome}. Última atualização: ${p.dataHoraUltimaAtualizacao}.`,
            source: `Datajud (${tribunal.toUpperCase()})`,
            date: p.dataHoraUltimaAtualizacao,
            content: `DADOS OFICIAIS DATAJUD (CNJ):\n\nNúmero: ${p.numeroProcesso}\nClasse: ${p.classe?.nome}\nÓrgão: ${p.orgaoJulgador?.nome}\nTribunal: ${tribunal.toUpperCase()}\n\nÚltima Movimentação: ${p.movimentos?.[0]?.nome || 'Não informada'}`
          });
        }
      } catch (e) {
        logWarn(`[Datajud] Falha na consulta ao tribunal ${tribunal}`);
      }
      if (records.length >= 5) break;
    }
    return records;
  }

  /**
   * Busca real via RSS do Google News (Snippets confiáveis para Diários Oficiais)
   */
  private async searchRSSContent(query: string, label: string): Promise<LegalRecord[]> {
    logInfo(`[RSSContent] Buscando conteúdo real para: ${query}`);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await axios.get(url, { timeout: 10000 });
      const xml = response.data;
      
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      return items.slice(0, 5).map((item: string) => {
        const title = (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Registro';
        const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
        const date = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || label;
        const description = (item.match(/<description>(.*?)<\/description>/))?.[1] || '';
        
        const cleanSnippet = description
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        
        return {
          title: title.replace(/&amp;/g, '&'),
          url: link,
          excerpt: cleanSnippet,
          source: label,
          date: date,
          content: `AUDITORIA SETH VII - REGISTRO REAL:\n\nFONTE: ${source}\nDATA: ${date}\n\n${title}\n\n${cleanSnippet}`
        };
      });
    } catch (error) {
      return [];
    }
  }

  async searchLegalRecords(politicianName: string): Promise<LegalRecord[]> {
    // Tenta primeiro Datajud (Oficial), depois RSS (Notícias/Diários)
    const datajud = await this.searchDatajud(politicianName);
    if (datajud.length > 0) return datajud;
    
    return this.searchRSSContent(`"${politicianName}" processo judicial condenação`, 'Justiça');
  }

  async searchQueridoDiario(politicianName: string): Promise<LegalRecord[]> {
    return this.searchRSSContent(`"${politicianName}" "diário oficial" decreto medalha`, 'Diário Oficial');
  }
}

export const jusBrasilAlternative = new JusBrasilAlternative();
