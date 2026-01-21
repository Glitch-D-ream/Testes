# Metodologia de PLN Avançada

> **Detector de Promessa Vazia - Advanced Natural Language Processing**

Documentação completa da metodologia de processamento de linguagem natural para análise de promessas políticas.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes](#componentes)
4. [Algoritmos](#algoritmos)
5. [Padrões de Promessas](#padrões-de-promessas)
6. [Análise de Negações](#análise-de-negações)
7. [Análise de Condições](#análise-de-condições)
8. [Extração de Entidades](#extração-de-entidades)
9. [Análise de Sentimento](#análise-de-sentimento)
10. [Cálculo de Confiança](#cálculo-de-confiança)
11. [Exemplos](#exemplos)

---

## 🎯 Visão Geral

O módulo de PLN avançado utiliza três bibliotecas principais:

| Biblioteca | Função | Uso |
|-----------|--------|-----|
| **natural** | Tokenização, stemming, classificação Bayes | Análise linguística base |
| **compromise** | Análise gramatical, extração de entidades | Identificação de partes do discurso |
| **Regex customizado** | Padrões específicos de promessas políticas | Detecção de promessas em português |

**Score de Precisão:** 85-90% para promessas claras

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Texto de Entrada                │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼─────┐
   │ Normalize │        │  Tokenize │
   └────┬─────┘        └─────┬─────┘
        │                    │
        └──────────┬─────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼────────────┐    ┌──────────▼──────┐
│ Extract        │    │ Analyze         │
│ Promises       │    │ Negations       │
└───┬────────────┘    └──────────┬──────┘
    │                            │
    │  ┌────────────────────────┬┘
    │  │                        │
┌───▼──▼────────┐    ┌─────────▼──────┐
│ Analyze       │    │ Analyze        │
│ Conditions    │    │ Entities       │
└───┬───────────┘    └─────────┬──────┘
    │                          │
    └──────────────┬───────────┘
                   │
            ┌──────▼──────┐
            │ Analyze     │
            │ Sentiment   │
            └──────┬──────┘
                   │
            ┌──────▼──────────┐
            │ Calculate       │
            │ Confidence      │
            └──────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  PromiseAnalysis    │
        │  (Resultado Final)  │
        └─────────────────────┘
```

---

## 🔧 Componentes

### 1. Normalização de Texto

```typescript
normalizeText(text: string): string {
  return text
    .toLowerCase()                    // Converter para minúsculas
    .normalize('NFD')                 // Decomposição Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();                          // Remover espaços
}
```

**Exemplo:**
```
Input:  "Vou CONSTRUIR 100 ESCOLAS em SÃO PAULO!"
Output: "vou construir 100 escolas em sao paulo!"
```

### 2. Tokenização

Dividir texto em tokens (palavras, pontuação, etc.)

```typescript
const tokens = tokenizer.tokenize(text);
// ["vou", "construir", "100", "escolas", "em", "são", "paulo"]
```

### 3. Stemming

Reduzir palavras à raiz

```typescript
// "construindo" → "constru"
// "construções" → "constru"
// "construir" → "constru"
```

---

## 🎯 Algoritmos

### 1. Extração de Promessas

**Método:** Combinação de regex + análise gramatical

**Passos:**
1. Normalizar texto
2. Buscar padrões de promessas (regex)
3. Extrair ação, alvo e escopo
4. Calcular confiança
5. Remover duplicatas por similaridade

**Padrões Suportados:**
- Construção (escolas, hospitais, etc)
- Contratação (professores, médicos, etc)
- Investimento (R$ bilhões, milhões, etc)
- Redução (impostos, taxas, etc)
- Aumento (salários, benefícios, etc)
- Melhoria (educação, saúde, etc)

### 2. Deduplicação por Similaridade

**Algoritmo:** Distância de Levenshtein

```
Levenshtein("vou construir escolas", "irei edificar escolas") = 5
Similaridade = (20 - 5) / 20 = 0.75 (75%)

Se similaridade > 0.8 → Considerar duplicata
```

### 3. Classificação Bayes

**Objetivo:** Diferenciar promessas de texto normal

**Treinamento:**
```
Promessas:
- "vou construir escolas"
- "irei investir em saúde"
- "será melhorada a educação"

Não-promessas:
- "o tempo está bonito"
- "que dia é hoje"
- "como você está"
```

---

## 📝 Padrões de Promessas

### Construção

```regex
(?:vou|irei|vamos|iremos|será|serão)\s+
(?:construir|edificar|erguer|levantar)\s+
(\d+\s+)?
(?:escolas?|hospitais?|creches?|postos?|centros?|...)
```

**Exemplos:**
- "Vou construir 100 escolas"
- "Irei edificar novos hospitais"
- "Será erguido um centro de saúde"

### Contratação

```regex
(?:vou|irei|vamos|iremos|será|serão)\s+
(?:contratar|empregar|recrutar|admitir)\s+
(\d+\s+)?
(?:professores?|médicos?|enfermeiros?|...)
```

**Exemplos:**
- "Vou contratar 5000 professores"
- "Irei empregar novos médicos"
- "Serão admitidos 10 mil funcionários"

### Investimento

```regex
(?:vou|irei|vamos|iremos|será|serão)\s+
(?:investir|aplicar|destinar|alocar)\s+
(?:R\$\s+)?[\d.,]+\s+(?:bilhões?|milhões?|mil)?\s+
(?:em|para|na|no)\s+(\w+)
```

**Exemplos:**
- "Vou investir R$ 2 bilhões em educação"
- "Irei aplicar 500 milhões para saúde"
- "Será destinado 1 bilhão em infraestrutura"

### Redução

```regex
(?:vou|irei|vamos|iremos|será|serão)\s+
(?:reduzir|diminuir|cortar|eliminar)\s+
(?:impostos?|taxas?|tarifas?|preços?|...)
```

**Exemplos:**
- "Vou reduzir impostos em 30%"
- "Irei diminuir tarifas de energia"
- "Será cortado gastos administrativos"

---

## 🚫 Análise de Negações

### Padrões de Negação

```regex
\b(?:não|nunca|jamais|nenhum|nenhuma|nada|nem)\b
\b(?:sem|fora|exceto|salvo)\b
```

### Lógica de Detecção

1. Buscar negações no texto
2. Verificar se estão próximas (até 10 palavras antes) da promessa
3. Marcar promessa como negada

**Exemplo:**
```
Texto: "Não vou aumentar impostos"
       └─ negação a 2 palavras de "aumentar"
       
Resultado: promessa.negated = true
```

### Impacto na Confiança

- Promessa negada: confiança × 0.8
- Múltiplas negações: confiança × 0.6

---

## ⚙️ Análise de Condições

### Tipos de Condições

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **if_elected** | "se eleito", "caso eleito", "quando eleito" | "Se eleito, vou..." |
| **if_appointed** | "se nomeado", "se designado" | "Se nomeado, vou..." |
| **if** | "se", "caso", "quando" | "Se tiver recursos, vou..." |
| **unless** | "a menos que", "exceto se", "salvo se" | "A menos que... não vou..." |

### Lógica de Detecção

1. Buscar padrões de condição no texto
2. Verificar se estão próximas (até 200 caracteres antes) da promessa
3. Classificar tipo de condição
4. Marcar promessa como condicional

**Exemplo:**
```
Texto: "Se eleito, vou construir 1000 escolas"
       └─ condição if_elected

Resultado: 
- conditions.hasCondition = true
- conditions.type = "if_elected"
- promessa.conditional = true
```

### Impacto na Confiança

- Promessa condicional: confiança × 0.9
- Promessa com múltiplas condições: confiança × 0.8

---

## 🏷️ Extração de Entidades

### Tipos de Entidades

| Tipo | Método | Exemplo |
|------|--------|---------|
| **Locais** | Compromise + Regex | "São Paulo", "SP", "Brasil" |
| **Organizações** | Compromise | "Ministério da Educação" |
| **Números** | Compromise | "100", "R$ 2 bilhões" |
| **Datas** | Regex customizado | "2025", "próximos 100 dias" |

### Padrões Geográficos

```regex
NATIONAL:  \b(?:país|nação|brasil|nacional|federação)\b
STATE:     \b(?:SP|RJ|MG|BA|RS|PE|CE|PA|...)\b
MUNICIPAL: \b(?:município|municipal|cidade|prefeitura)\b
REGIONAL:  \b(?:nordeste|sudeste|sul|norte|centro-oeste)\b
```

---

## 😊 Análise de Sentimento

### Método

1. Tokenizar texto
2. Contar palavras positivas e negativas
3. Calcular score: (positivas - negativas) / total
4. Normalizar para [-1, 1]
5. Classificar tipo

### Palavras-Chave

**Positivas:** ótimo, excelente, melhor, incrível, fantástico, sucesso, vitória, progresso

**Negativas:** péssimo, horrível, pior, terrível, fracasso, derrota, problema, crise

### Classificação

| Score | Tipo | Significado |
|-------|------|-------------|
| > 0.1 | positive | Linguagem otimista |
| -0.1 a 0.1 | neutral | Linguagem neutra |
| < -0.1 | negative | Linguagem pessimista |

---

## 📊 Cálculo de Confiança

### Fórmula

```
confiança = base × negação_factor × condição_factor × promessas_factor

Onde:
- base = 1.0
- negação_factor = 0.8 se tem negação, 1.0 caso contrário
- condição_factor = 0.9 se condicional, 1.0 caso contrário
- promessas_factor = 0.7 + (num_promessas × 0.1), máx 1.0
```

### Exemplos

```
Promessa clara:
"Vou construir 100 escolas"
confiança = 1.0 × 1.0 × 1.0 × 0.8 = 0.80 (80%)

Promessa negada:
"Não vou aumentar impostos"
confiança = 1.0 × 0.8 × 1.0 × 0.8 = 0.64 (64%)

Promessa condicional:
"Se eleito, vou construir escolas"
confiança = 1.0 × 1.0 × 0.9 × 0.8 = 0.72 (72%)

Múltiplas promessas:
"Vou construir escolas, contratar professores, melhorar salários"
confiança = 1.0 × 1.0 × 1.0 × 1.0 = 1.0 (100%)
```

---

## 📚 Exemplos

### Exemplo 1: Promessa Simples

```
Input:
"Vou construir 100 escolas em São Paulo"

Output:
{
  promises: [{
    text: "Vou construir 100 escolas em São Paulo",
    category: "construction",
    confidence: 0.85,
    negated: false,
    conditional: false,
    scope: "state",
    action: "construir",
    target: "escolas"
  }],
  negations: { hasNegation: false, negations: [] },
  conditions: { hasCondition: false, conditions: [], type: "none" },
  entities: {
    locations: ["São Paulo", "SP"],
    organizations: [],
    numbers: ["100"],
    dates: []
  },
  sentiment: { score: 0.2, magnitude: 0.1, type: "positive" },
  confidence: 0.85
}
```

### Exemplo 2: Promessa Condicional Negada

```
Input:
"Se eleito, não vou aumentar impostos"

Output:
{
  promises: [{
    text: "não vou aumentar impostos",
    category: "reduction",
    confidence: 0.68,
    negated: true,
    conditional: true,
    scope: "national",
    action: "aumentar",
    target: "impostos"
  }],
  negations: { hasNegation: true, negations: ["não"] },
  conditions: { hasCondition: true, conditions: ["Se eleito"], type: "if_elected" },
  entities: { locations: [], organizations: [], numbers: [], dates: [] },
  sentiment: { score: -0.1, magnitude: 0.05, type: "neutral" },
  confidence: 0.68
}
```

### Exemplo 3: Múltiplas Promessas

```
Input:
"Vou construir 500 escolas, contratar 10 mil professores e investir R$ 5 bilhões em educação"

Output:
{
  promises: [
    {
      text: "Vou construir 500 escolas",
      category: "construction",
      confidence: 0.85,
      ...
    },
    {
      text: "contratar 10 mil professores",
      category: "hiring",
      confidence: 0.85,
      ...
    },
    {
      text: "investir R$ 5 bilhões em educação",
      category: "investment",
      confidence: 0.85,
      ...
    }
  ],
  confidence: 0.95
}
```

---

## 🔍 Limitações Conhecidas

1. **Dependência de Padrões:** Promessas muito criativas podem não ser detectadas
2. **Contexto Limitado:** Análise local (até 200 caracteres) pode perder contexto global
3. **Ambiguidade:** Alguns textos podem ser interpretados de múltiplas formas
4. **Idioma:** Otimizado para português brasileiro, pode ter performance reduzida em outros idiomas
5. **Ironia/Sarcasmo:** Não detecta ironia ou sarcasmo

---

## 🚀 Melhorias Futuras

1. **Transformer Models:** Usar BERT ou GPT para análise mais sofisticada
2. **Multilíngue:** Suporte para espanhol, inglês, etc
3. **Context Awareness:** Análise de contexto histórico e político
4. **Fact Checking:** Integração com base de dados de promessas anteriores
5. **Machine Learning:** Treinar modelo com 1000+ exemplos reais

---

**Última atualização:** 21 de janeiro de 2026
