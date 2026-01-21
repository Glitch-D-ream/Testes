import { test, expect } from '@playwright/test';

test.describe('Fluxo de Submissão de Análise', () => {
  test('deve submeter análise e visualizar resultados', async ({ page }) => {
    // 1. Navegar para a página inicial
    await page.goto('/');
    await expect(page).toHaveTitle(/Detector de Promessa Vazia/i);

    // 2. Preencher formulário de análise
    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill(
      'Vou construir 1000 escolas em todo o país e aumentar os salários dos professores em 50%'
    );

    const authorInput = page.locator('input[name="author"]');
    await authorInput.fill('Candidato X');

    const categorySelect = page.locator('select[name="category"]');
    await categorySelect.selectOption('EDUCATION');

    // 3. Submeter formulário
    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    // 4. Aguardar resultado
    await page.waitForURL(/\/analysis\/\w+/);

    // 5. Verificar que a análise foi exibida
    const probabilityScore = page.locator('[data-testid="probability-score"]');
    await expect(probabilityScore).toBeVisible();

    // 6. Verificar que as promessas foram extraídas
    const promisesList = page.locator('[data-testid="promises-list"]');
    await expect(promisesList).toBeVisible();

    const promiseItems = page.locator('[data-testid="promise-item"]');
    const count = await promiseItems.count();
    expect(count).toBeGreaterThan(0);

    // 7. Verificar que há disclaimer legal
    const disclaimer = page.locator('[data-testid="legal-disclaimer"]');
    await expect(disclaimer).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/');

    // Tentar submeter sem preencher campos
    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    // Deve mostrar erro
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
  });

  test('deve rejeitar texto muito curto', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Curto');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('mínimo');
  });

  test('deve desabilitar botão durante submissão', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill(
      'Vou implementar políticas públicas para melhorar a qualidade de vida da população'
    );

    const submitButton = page.locator('button:has-text("Analisar")');

    // Clicar e verificar que o botão fica desabilitado
    await submitButton.click();
    await expect(submitButton).toBeDisabled();

    // Aguardar resultado
    await page.waitForURL(/\/analysis\/\w+/);

    // Botão deve estar habilitado novamente (se voltar à página)
  });

  test('deve exibir categorias de promessas', async ({ page }) => {
    await page.goto('/');

    const categorySelect = page.locator('select[name="category"]');
    const options = await categorySelect.locator('option').count();

    expect(options).toBeGreaterThan(1);

    // Verificar que as categorias esperadas existem
    await expect(categorySelect.locator('option[value="EDUCATION"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="HEALTH"]')).toBeVisible();
    await expect(categorySelect.locator('option[value="ECONOMY"]')).toBeVisible();
  });

  test('deve permitir análise anônima', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou reduzir a inflação e gerar empregos para todos');

    // Deixar author vazio (anônimo)
    const authorInput = page.locator('input[name="author"]');
    await authorInput.clear();

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    // Deve funcionar mesmo sem autor
    await page.waitForURL(/\/analysis\/\w+/);

    const probabilityScore = page.locator('[data-testid="probability-score"]');
    await expect(probabilityScore).toBeVisible();
  });

  test('deve mostrar loading state', async ({ page }) => {
    await page.goto('/');

    const textInput = page.locator('textarea[name="text"]');
    await textInput.fill('Vou construir infraestrutura em todo o país');

    const submitButton = page.locator('button:has-text("Analisar")');
    await submitButton.click();

    // Verificar loading spinner
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    await expect(loadingSpinner).toBeVisible();

    // Deve desaparecer após resultado
    await page.waitForURL(/\/analysis\/\w+/);
    await expect(loadingSpinner).not.toBeVisible();
  });
});
