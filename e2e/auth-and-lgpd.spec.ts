import { test, expect } from '@playwright/test';

test.describe('Autenticação e LGPD', () => {
  test('deve exibir modal de consentimento LGPD no registro', async ({ page }) => {
    await page.goto('/register');

    // Verificar que modal de consentimento aparece
    const consentModal = page.locator('[data-testid="consent-modal"]');
    await expect(consentModal).toBeVisible();

    // Verificar checkboxes de consentimento
    const dataProcessingCheckbox = page.locator('input[name="dataProcessing"]');
    const privacyCheckbox = page.locator('input[name="privacyPolicy"]');

    await expect(dataProcessingCheckbox).toBeVisible();
    await expect(privacyCheckbox).toBeVisible();

    // Botão de aceitar deve estar desabilitado inicialmente
    const acceptButton = page.locator('button:has-text("Aceitar")');
    await expect(acceptButton).toBeDisabled();
  });

  test('deve habilitar botão apenas quando ambos consentimentos são marcados', async ({
    page,
  }) => {
    await page.goto('/register');

    const dataProcessingCheckbox = page.locator('input[name="dataProcessing"]');
    const privacyCheckbox = page.locator('input[name="privacyPolicy"]');
    const acceptButton = page.locator('button:has-text("Aceitar")');

    // Marcar apenas um
    await dataProcessingCheckbox.check();
    await expect(acceptButton).toBeDisabled();

    // Marcar o segundo
    await privacyCheckbox.check();
    await expect(acceptButton).toBeEnabled();

    // Desmarcar um
    await dataProcessingCheckbox.uncheck();
    await expect(acceptButton).toBeDisabled();
  });

  test('deve exibir política de privacidade', async ({ page }) => {
    await page.goto('/privacy');

    // Verificar título
    const title = page.locator('h1:has-text("Política de Privacidade")');
    await expect(title).toBeVisible();

    // Verificar seções principais
    const introSection = page.locator('h2:has-text("Introdução")');
    await expect(introSection).toBeVisible();

    const dataSection = page.locator('h2:has-text("Informações que Coletamos")');
    await expect(dataSection).toBeVisible();

    const lgpdSection = page.locator('h2:has-text("Seus Direitos LGPD")');
    await expect(lgpdSection).toBeVisible();

    // Verificar que menciona direitos
    const content = page.locator('body');
    await expect(content).toContainText('Direito ao esquecimento');
    await expect(content).toContainText('Portabilidade');
  });

  test('deve permitir registro com consentimento', async ({ page }) => {
    await page.goto('/register');

    // Preencher formulário
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const nameInput = page.locator('input[name="name"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');
    await nameInput.fill('Test User');

    // Marcar consentimentos
    const dataProcessingCheckbox = page.locator('input[name="dataProcessing"]');
    const privacyCheckbox = page.locator('input[name="privacyPolicy"]');

    await dataProcessingCheckbox.check();
    await privacyCheckbox.check();

    // Submeter
    const submitButton = page.locator('button:has-text("Registrar")');
    await submitButton.click();

    // Deve redirecionar para dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    // Deve redirecionar para dashboard
    await page.waitForURL('/dashboard');
  });

  test('deve rejeitar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('WrongPassword123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    // Deve mostrar erro
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('inválidas');
  });

  test('deve permitir logout', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    await page.waitForURL('/dashboard');

    // Fazer logout
    const logoutButton = page.locator('button:has-text("Sair")');
    await logoutButton.click();

    // Deve voltar para login
    await page.waitForURL('/login');
  });

  test('deve exibir opções de dados do usuário', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    await page.waitForURL('/dashboard');

    // Navegar para configurações
    await page.goto('/settings/data');

    // Verificar opções LGPD
    const exportButton = page.locator('button:has-text("Exportar Meus Dados")');
    await expect(exportButton).toBeVisible();

    const deleteButton = page.locator('button:has-text("Deletar Meus Dados")');
    await expect(deleteButton).toBeVisible();
  });

  test('deve permitir exportação de dados', async ({ page, context }) => {
    // Fazer login
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    await page.waitForURL('/dashboard');

    // Ir para settings
    await page.goto('/settings/data');

    // Interceptar download
    const downloadPromise = context.waitForEvent('download');

    // Clicar em exportar
    const exportButton = page.locator('button:has-text("Exportar Meus Dados")');
    await exportButton.click();

    // Aguardar download
    const download = await downloadPromise;

    // Verificar que é um arquivo JSON
    expect(download.suggestedFilename()).toContain('.json');

    // Verificar conteúdo
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const json = JSON.parse(content);

    expect(json.user).toBeDefined();
    expect(json.analyses).toBeDefined();
  });

  test('deve solicitar confirmação antes de deletar dados', async ({ page }) => {
    // Fazer login
    await page.goto('/login');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('SecurePass123!');

    const submitButton = page.locator('button:has-text("Entrar")');
    await submitButton.click();

    await page.waitForURL('/dashboard');

    // Ir para settings
    await page.goto('/settings/data');

    // Clicar em deletar
    const deleteButton = page.locator('button:has-text("Deletar Meus Dados")');
    await deleteButton.click();

    // Deve mostrar modal de confirmação
    const confirmModal = page.locator('[data-testid="delete-confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Verificar que avisa sobre consequências
    await expect(confirmModal).toContainText('irreversível');

    // Cancelar
    const cancelButton = page.locator('button:has-text("Cancelar")');
    await cancelButton.click();

    // Modal deve fechar
    await expect(confirmModal).not.toBeVisible();
  });

  test('deve exibir aviso de rate limiting', async ({ page }) => {
    await page.goto('/');

    // Tentar fazer múltiplas submissões rapidamente
    const textInput = page.locator('textarea[name="text"]');
    const submitButton = page.locator('button:has-text("Analisar")');

    for (let i = 0; i < 15; i++) {
      await textInput.fill(`Promessa número ${i}`);
      await submitButton.click();

      // Aguardar um pouco
      await page.waitForTimeout(100);
    }

    // Deve mostrar aviso de rate limiting
    const rateLimitWarning = page.locator('[data-testid="rate-limit-warning"]');
    await expect(rateLimitWarning).toBeVisible();
  });
});
