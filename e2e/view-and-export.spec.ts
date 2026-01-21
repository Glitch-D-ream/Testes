import { test, expect } from '@playwright/test';

test.describe('Visualização e Exportação de Resultados', () => {
  test('deve exibir análise completa com todas as seções', async ({ page }) => {
    // Primeiro, submeter uma análise
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill(
      'Vou aumentar investimentos em educação, saúde e infraestrutura nos próximos 4 anos'
    );

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar seções da análise
    const scoreSection = page.locator('[data-testid="score-section"]');
    await expect(scoreSection).toBeVisible();

    const promisesSection = page.locator('[data-testid="promises-section"]');
    await expect(promisesSection).toBeVisible();

    const methodologySection = page.locator('[data-testid="methodology-section"]');
    await expect(methodologySection).toBeVisible();

    const disclaimerSection = page.locator('[data-testid="disclaimer-section"]');
    await expect(disclaimerSection).toBeVisible();
  });

  test('deve exibir score de probabilidade com visualização', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou reduzir impostos e gerar 500 mil empregos');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar score numérico
    const scoreValue = page.locator('[data-testid="probability-score-value"]');
    await expect(scoreValue).toBeVisible();

    const scoreText = await scoreValue.textContent();
    const scoreNumber = parseFloat(scoreText || '0');

    expect(scoreNumber).toBeGreaterThanOrEqual(0);
    expect(scoreNumber).toBeLessThanOrEqual(100);

    // Verificar barra de progresso
    const scoreBar = page.locator('[data-testid="probability-score-bar"]');
    await expect(scoreBar).toBeVisible();
  });

  test('deve listar todas as promessas extraídas', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill(
      'Vou construir escolas, aumentar salários e reduzir criminalidade'
    );

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar lista de promessas
    const promiseItems = page.locator('[data-testid="promise-item"]');
    const count = await promiseItems.count();

    expect(count).toBeGreaterThanOrEqual(2);

    // Verificar que cada promessa tem informações
    for (let i = 0; i < count; i++) {
      const item = promiseItems.nth(i);
      const text = item.locator('[data-testid="promise-text"]');
      const category = item.locator('[data-testid="promise-category"]');
      const confidence = item.locator('[data-testid="promise-confidence"]');

      await expect(text).toBeVisible();
      await expect(category).toBeVisible();
      await expect(confidence).toBeVisible();
    }
  });

  test('deve exibir metodologia e disclaimers', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou implementar políticas públicas inovadoras');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar seção de metodologia
    const methodologyTitle = page.locator('h2:has-text("Metodologia")');
    await expect(methodologyTitle).toBeVisible();

    const methodologyText = page.locator('[data-testid="methodology-text"]');
    await expect(methodologyText).toBeVisible();

    // Verificar disclaimer legal
    const disclaimerTitle = page.locator('h2:has-text("Disclaimer Legal")');
    await expect(disclaimerTitle).toBeVisible();

    const disclaimerText = page.locator('[data-testid="disclaimer-text"]');
    await expect(disclaimerText).toBeVisible();

    // Verificar que menciona análise probabilística
    await expect(disclaimerText).toContainText('probabilística');
  });

  test('deve exportar análise como JSON', async ({ page, context }) => {
    // Interceptar download
    const downloadPromise = context.waitForEvent('download');

    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou melhorar a qualidade de vida da população');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Clicar em botão de exportação
    const exportButton = page.locator('button:has-text("Exportar")');
    await exportButton.click();

    // Aguardar download
    const download = await downloadPromise;

    // Verificar que é um arquivo JSON
    expect(download.suggestedFilename()).toContain('.json');

    // Verificar conteúdo do arquivo
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const json = JSON.parse(content);

    expect(json.analysis).toBeDefined();
    expect(json.promises).toBeDefined();
    expect(json.methodology).toBeDefined();
  });

  test('deve permitir compartilhar análise', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou criar oportunidades de emprego para jovens');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar botão de compartilhamento
    const shareButton = page.locator('button:has-text("Compartilhar")');
    await expect(shareButton).toBeVisible();

    // Clicar em compartilhar
    await shareButton.click();

    // Verificar que modal ou menu aparece
    const shareMenu = page.locator('[data-testid="share-menu"]');
    await expect(shareMenu).toBeVisible();

    // Verificar opções de compartilhamento
    const copyLink = page.locator('button:has-text("Copiar link")');
    await expect(copyLink).toBeVisible();
  });

  test('deve voltar para nova análise', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou implementar mudanças significativas');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    await page.waitForURL(/\/analysis\/\w+/);

    // Verificar botão de nova análise
    const newAnalysisButton = page.locator('button:has-text("Nova Análise")');
    await expect(newAnalysisButton).toBeVisible();

    await newAnalysisButton.click();

    // Deve voltar para página inicial
    await page.waitForURL('/');

    // Formulário deve estar vazio
    const textInputReset = page.locator('textarea[name="text"]');
    await expect(textInputReset).toHaveValue('');
  });

  test('deve exibir histórico de análises', async ({ page }) => {
    // Navegar para página de histórico
    await page.goto('/history');

    // Verificar que página carregou
    await expect(page.locator('h1:has-text("Histórico")')).toBeVisible();

    // Verificar tabela de análises
    const analysisTable = page.locator('[data-testid="analysis-table"]');
    await expect(analysisTable).toBeVisible();

    // Verificar colunas
    const headerCells = page.locator('[data-testid="analysis-table"] th');
    expect(await headerCells.count()).toBeGreaterThan(0);
  });

  test('deve filtrar histórico por categoria', async ({ page }) => {
    await page.goto('/history');

    // Selecionar categoria
    const categoryFilter = page.locator('select[name="category-filter"]');
    await categoryFilter.selectOption('EDUCATION');

    // Aguardar filtro ser aplicado
    await page.waitForTimeout(500);

    // Verificar que apenas análises de educação aparecem
    const rows = page.locator('[data-testid="analysis-row"]');
    const count = await rows.count();

    if (count > 0) {
      const firstRowCategory = rows.first().locator('[data-testid="row-category"]');
      await expect(firstRowCategory).toContainText('EDUCATION');
    }
  });
});
