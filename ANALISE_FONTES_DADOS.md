
# 📊 Análise de Viabilidade Técnica: Novas Fontes de Dados Seth VII

Após pesquisa detalhada, mapeei as principais fontes de dados governamentais e jurídicos para expansão do Seth VII.

## ⚖️ Fontes Jurídicas

| Fonte | Tipo | Custo | Vantagem | Desvantagem | Estratégia Seth VII |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Jusbrasil** | API | Pago (Contrato) | Dados estruturados, processos de todo o Brasil. | Requer CNPJ e contrato formal. | **Scout (Fallback):** Usar busca direta em Diários Oficiais e tribunais específicos quando a API não estiver disponível. |
| **Escavador** | API | Pago (Créditos) | Ótima cobertura de nomes e processos. | Custo por requisição. | **Integração Futura:** Recomendar ao usuário para auditorias de alta precisão. |
| **Tribunais (TJ/TRF)** | Site | Gratuito | Dados primários e oficiais. | Cada tribunal tem um formato e bloqueios (Captchas). | **Scout (Dorking):** Buscar arquivos indexados via Google para contornar interfaces complexas. |

## 🏛️ Fontes Governamentais (Transparência)

| Fonte | Tipo | Custo | Vantagem | Desvantagem | Estratégia Seth VII |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Portal da Transparência (Federal)** | API | Gratuito | Dados de servidores, viagens, licitações e contratos federais. | Limite de 90 req/min. | **Integração Direta:** Implementar conector usando Token de e-mail. |
| **Dados.gov.br** | API/CSV | Gratuito | Catálogo centralizado de diversos órgãos. | Dados nem sempre atualizados em tempo real. | **Snapshot:** Usar para alimentar o Snapshot Nacional (Ironclad). |
| **Diário Oficial (DOU)** | Site/PDF | Gratuito | Fonte máxima da verdade legislativa e executiva. | Processamento pesado de texto. | **Ingestion (OCR):** Já integrado via Fallback de Documentos. |

## 🛠️ Conclusão Técnica

Para o **Seth VII**, a melhor abordagem é **híbrida**:
1.  **APIs Gratuitas:** Integrar imediatamente o Portal da Transparência Federal.
2.  **Sites/PDFs:** Continuar aprimorando o Scout para ler Diários Oficiais e Tribunais sem depender de APIs pagas como Jusbrasil, que podem ser proibitivas para o usuário final.
3.  **Redes Sociais:** Manter o uso de Scrapers estáticos para Twitter/X e Instagram via agregadores de notícias.
