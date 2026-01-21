# Guia de Contribuição

> **Obrigado por considerar contribuir para o Detector de Promessa Vazia!**

Este documento fornece diretrizes e instruções para contribuir com o projeto.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Processo de Pull Request](#processo-de-pull-request)
4. [Padrões de Código](#padrões-de-código)
5. [Testes](#testes)
6. [Documentação](#documentação)
7. [Reportar Bugs](#reportar-bugs)
8. [Sugerir Melhorias](#sugerir-melhorias)

---

## 🤝 Código de Conduta

Este projeto adere a um Código de Conduta que esperamos que todos os contribuidores sigam:

- **Respeito:** Trate todos com respeito e dignidade
- **Inclusão:** Bem-vindo a pessoas de todos os backgrounds
- **Profissionalismo:** Mantenha discussões construtivas e profissionais
- **Transparência:** Seja honesto e aberto sobre suas intenções
- **Responsabilidade:** Assuma responsabilidade por suas ações

**Violações** devem ser reportadas para o mantenedor do projeto.

---

## 💡 Como Contribuir

### Tipos de Contribuições

1. **Código**
   - Novas funcionalidades
   - Bug fixes
   - Refatoração
   - Performance improvements

2. **Testes**
   - Testes unitários
   - Testes E2E
   - Testes de integração
   - Cobertura de edge cases

3. **Documentação**
   - README
   - API docs
   - Guias de setup
   - Exemplos de uso
   - Comentários no código

4. **Issues**
   - Reportar bugs
   - Sugerir melhorias
   - Fazer perguntas
   - Discutir design

---

## 🔄 Processo de Pull Request

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/Testes.git
cd Testes

# Adicione o repositório original como remote
git remote add upstream https://github.com/Glitch-D-ream/Testes.git
```

### 2. Criar Branch

```bash
# Atualize main
git fetch upstream
git checkout main
git merge upstream/main

# Crie uma branch para sua feature
git checkout -b feature/sua-feature-nome
# ou para bug fix
git checkout -b fix/seu-bug-nome
```

**Convenção de nomes:**
- `feature/descricao-da-feature`
- `fix/descricao-do-bug`
- `docs/descricao-da-doc`
- `test/descricao-do-teste`
- `refactor/descricao-da-refatoracao`

### 3. Fazer Mudanças

```bash
# Faça suas mudanças
# Commit regularmente com mensagens descritivas
git add .
git commit -m "feat: adicionar nova funcionalidade X"
```

**Formato de commit:**
```
<tipo>(<escopo>): <descrição>

<corpo opcional>

<rodapé opcional>
```

**Tipos:**
- `feat:` Nova funcionalidade
- `fix:` Bug fix
- `docs:` Mudanças na documentação
- `style:` Formatação, sem mudanças de lógica
- `refactor:` Refatoração de código
- `perf:` Melhorias de performance
- `test:` Adição ou modificação de testes
- `chore:` Mudanças em build, deps, etc

**Exemplos:**
```
feat(auth): adicionar autenticação com 2FA
fix(nlp): corrigir extração de promessas em português
docs(api): atualizar documentação de endpoints
test(probability): adicionar testes para novo fator
```

### 4. Testar Localmente

```bash
# Instale dependências
pnpm install

# Execute testes
pnpm test
pnpm test:e2e

# Verifique TypeScript
pnpm check

# Build
pnpm build
```

### 5. Push e Pull Request

```bash
# Push sua branch
git push origin feature/sua-feature-nome

# Abra um Pull Request no GitHub
# Descreva suas mudanças
# Referencie issues relacionadas
```

**Template de PR:**
```markdown
## Descrição
Breve descrição do que foi mudado.

## Tipo de Mudança
- [ ] Nova funcionalidade
- [ ] Bug fix
- [ ] Mudança que quebra compatibilidade
- [ ] Mudança na documentação

## Como foi testado?
Descreva os testes que você executou.

## Checklist
- [ ] Meu código segue o style guide
- [ ] Executei linter e formatação
- [ ] Adicionei testes para novas funcionalidades
- [ ] Atualizei a documentação
- [ ] Meus commits têm mensagens descritivas
- [ ] Não há conflitos com main
```

### 6. Code Review

- Mantenedores revisarão seu PR
- Podem solicitar mudanças
- Discuta feedback construtivamente
- Faça as mudanças solicitadas
- PR será merged quando aprovado

---

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ Bom
interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

async function getUserById(id: number): Promise<User> {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// ❌ Ruim
function getUser(id) {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

### React

```typescript
// ✅ Bom
interface AnalysisFormProps {
  onSubmit: (data: AnalysisData) => Promise<void>;
  isLoading?: boolean;
}

export function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit({ text });
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
}

// ❌ Ruim
export function AnalysisForm(props) {
  const handleSubmit = () => {
    props.onSubmit(props.text);
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Naming Conventions

```typescript
// Constantes
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// Funções
function calculateProbability() {}
async function fetchPublicData() {}
function isValidEmail() {}

// Variáveis
const userData: User = {};
const isLoading = false;
const errorMessage = '';

// Classes
class AnalysisService {}
class ProbabilityCalculator {}
```

### Comments

```typescript
// ✅ Bom - Explica o "por quê"
// Usar Levenshtein distance para encontrar promessas similares
// porque é mais tolerante a variações de texto que string matching exato
const similarity = calculateLevenshteinDistance(text1, text2);

// ❌ Ruim - Óbvio
// Calcular distância
const similarity = calculateLevenshteinDistance(text1, text2);
```

---

## 🧪 Testes

### Cobertura Esperada

- **Novas funcionalidades:** 80%+ de cobertura
- **Bug fixes:** Adicionar teste que reproduz o bug
- **Refatoração:** Manter cobertura existente

### Escrevendo Testes

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ProbabilityCalculator', () => {
  let calculator: ProbabilityCalculator;

  beforeEach(() => {
    calculator = new ProbabilityCalculator();
  });

  it('deve calcular probabilidade com 5 fatores', () => {
    const result = calculator.calculate({
      budgetaryViability: 0.7,
      authorHistory: 0.6,
      similarPromises: 0.8,
      geographicScope: 0.5,
      historicalTrends: 0.65,
    });

    expect(result).toBeCloseTo(0.65, 2);
  });

  it('deve retornar erro para entrada inválida', () => {
    expect(() => {
      calculator.calculate({ budgetaryViability: 1.5 });
    }).toThrow('Invalid factor value');
  });
});
```

### Executar Testes

```bash
# Todos os testes
pnpm test

# Modo watch
pnpm test:watch

# Com cobertura
pnpm test:coverage

# E2E
pnpm test:e2e
```

---

## 📚 Documentação

### Documentar Novas Funcionalidades

1. **Código comentado**
   ```typescript
   /**
    * Calcula a probabilidade de cumprimento de uma promessa
    * @param factors - Os 5 fatores de análise
    * @returns Score de 0 a 1
    */
   function calculateProbability(factors: Factors): number {
     // ...
   }
   ```

2. **README atualizado**
   - Adicione a nova funcionalidade à seção de Features
   - Atualize exemplos se necessário

3. **API.md atualizado**
   - Documente novos endpoints
   - Inclua exemplos de requisição/resposta

4. **ARCHITECTURE.md atualizado**
   - Explique como a funcionalidade se integra
   - Atualize diagramas se necessário

---

## 🐛 Reportar Bugs

### Template de Issue

```markdown
## Descrição
Descrição clara e concisa do bug.

## Passos para Reproduzir
1. Faça isso
2. Depois isso
3. Observe o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que realmente acontece.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [e.g., macOS, Windows, Linux]
- Node: [e.g., 22.13.0]
- pnpm: [e.g., 10.4.1]

## Logs
```
Cole logs relevantes aqui
```
```

---

## 💡 Sugerir Melhorias

### Template de Feature Request

```markdown
## Descrição
Descrição clara da melhoria sugerida.

## Problema que Resolve
Qual problema essa melhoria resolveria?

## Solução Proposta
Como você imagina que isso funcionaria?

## Alternativas Consideradas
Outras soluções que você pensou?

## Contexto Adicional
Qualquer outra informação relevante.
```

---

## 🚀 Processo de Release

1. **Merge para main**
   - Todos os testes passam
   - Code review aprovado
   - Documentação atualizada

2. **Versioning**
   - Semantic Versioning (MAJOR.MINOR.PATCH)
   - Tag git criada
   - Release notes escritas

3. **Deployment**
   - Build produção
   - Testes finais
   - Deploy automático

---

## 📞 Precisa de Ajuda?

- **Dúvidas sobre código?** Abra uma issue com a tag `question`
- **Quer discutir design?** Abra uma discussion
- **Encontrou um bug?** Reporte com a tag `bug`
- **Tem uma ideia?** Sugira com a tag `enhancement`

---

## 📖 Recursos Úteis

- [README.md](./README.md) - Visão geral do projeto
- [API.md](./API.md) - Documentação de endpoints
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Explicação da arquitetura
- [todo.md](./todo.md) - Roadmap do projeto

---

## ✨ Obrigado!

Sua contribuição é valiosa e ajuda a melhorar o Detector de Promessa Vazia para todos!

**Feliz contribuindo! 🚀**
