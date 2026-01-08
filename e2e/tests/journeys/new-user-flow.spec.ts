import { test, expect } from '../../fixtures/nectar.fixture';
import { getDomainFromUrl } from '../../fixtures/helpers';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const DOMAIN = getDomainFromUrl(NECTAR_URL);

/**
 * Journey 1: New User Complete Flow
 *
 * Tests the complete user journey from registration form validation,
 * through login, to searching and interacting with articles.
 *
 * Note: Actual registration submission is skipped due to reCAPTCHA.
 * We use the 'bootstrap-authenticated' scenario to simulate logged-in state.
 */

test.describe('Journey 1: Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${NECTAR_URL}/user/account/register`);
  });

  test('R1: displays registration form with all required fields', async ({ page }) => {
    // Verify heading
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    // Verify form fields using test-ids (Chakra FormLabel doesn't use htmlFor)
    await expect(page.getByTestId('register-given-name')).toBeVisible();
    await expect(page.getByTestId('register-family-name')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-password-confirm')).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // Verify ADS credentials info banner
    await expect(page.getByText('Your existing ADS credentials will work on SciX')).toBeVisible();
  });

  test('R2: validates password match', async ({ page }) => {
    // Fill required fields using test-ids
    await page.getByTestId('register-email').fill('test@example.com');
    await page.getByTestId('register-password').fill('SecurePass123!');
    await page.getByTestId('register-password-confirm').fill('DifferentPass456!');

    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify password mismatch error
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('R3: links to login page', async ({ page }) => {
    // Use test-id to be specific about which Login link
    await page.getByTestId('register-login-link').click();
    await expect(page).toHaveURL(/\/user\/account\/login/);
  });
});

test.describe('Journey 1: Login Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${NECTAR_URL}/user/account/login`);
  });

  test('L1: displays login form with all fields', async ({ page }) => {
    // Verify heading
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    // Verify form fields using test-ids
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // Verify helper links
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByTestId('login-register-link')).toBeVisible();

    // Verify ADS credentials info
    await expect(page.getByText('Your existing ADS credentials will work on SciX')).toBeVisible();
  });

  test('L2: links to registration page', async ({ page }) => {
    // Use test-id to avoid matching both "register here" and "Register" links
    await page.getByTestId('login-register-link').click();
    await expect(page).toHaveURL(/\/user\/account\/register/);
  });

  test('L3: links to forgot password', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/user\/account\/forgotpassword/);
  });
});

test.describe('Journey 1: Authenticated User Flow', () => {
  // Skip these tests until client-side API mocking is implemented
  // The stub server only handles server-side (middleware) requests
  // Client-side React Query calls still go to the real API
  test.skip();

  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });
  });

  test('J1-1: Search for articles from home page', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/`);

    // Use the search input (test-id from ModernForm component)
    await page.getByTestId('allSearchTermsInput').fill('dark matter');

    // Submit search
    await page.getByTestId('search-submit').click();

    // Verify results page loaded
    await expect(page).toHaveURL(/\/search/);

    // Verify results are displayed
    await expect(page.getByRole('article').first()).toBeVisible();
  });

  test('J1-2: View article abstract from search results', async ({ page }) => {
    // Navigate directly to search with results
    await page.goto(`${NECTAR_URL}/search?q=dark+matter`);

    // Wait for results
    await page.waitForSelector('article');

    // Get the first article title link
    const firstTitle = page.getByRole('article').first().getByRole('link').first();
    const titleText = await firstTitle.textContent();

    // Click on the title
    await firstTitle.click();

    // Verify abstract page loaded
    await expect(page).toHaveURL(/\/abs\/.+\/abstract/);

    // Verify we can see the title on the abstract page
    await expect(page.getByTestId('abstract-title')).toContainText(titleText?.slice(0, 20) || '');
  });

  test('J1-3: Add article to library from abstract page', async ({ page }) => {
    // Navigate to a known abstract page (using mock bibcode)
    await page.goto(`${NECTAR_URL}/abs/2020ApJ...900....1S/abstract`);

    // Click add to library button
    await page.getByRole('button', { name: /add to library/i }).click();

    // Verify modal opens
    await expect(page.getByTestId('add-library-modal')).toBeVisible();

    // Click the library selector to open library list
    await page.getByPlaceholder('Select library').click();

    // Wait for libraries to load and select first one
    await page.getByRole('row').filter({ hasText: /.+/ }).first().click();

    // Submit
    await page.getByRole('button', { name: 'Submit' }).first().click();

    // Verify success toast
    await expect(page.getByText(/added to library/i)).toBeVisible({ timeout: 10000 });
  });

  test('J1-4: Navigate to export citation from abstract', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/abs/2020ApJ...900....1S/abstract`);

    // Click Export Citation in sidebar
    await page.getByRole('link', { name: 'Export Citation' }).click();

    // Verify export page loaded
    await expect(page).toHaveURL(/\/exportcitation|\/export/);

    // Verify export form is visible
    await expect(page.getByText('Exporting record')).toBeVisible();
  });

  test('J1-5: Export citation and copy to clipboard', async ({ page }) => {
    // Navigate directly to export page
    await page.goto(`${NECTAR_URL}/abs/2020ApJ...900....1S/exportcitation/bibtex`);

    // Verify export preview is shown
    await expect(page.getByTestId('export-preview')).toBeVisible();

    // Change format using the format selector
    const formatSelect = page.getByTestId('export-format-select');
    await formatSelect.click();

    // Select a different format (RIS)
    await page.getByText('RIS', { exact: true }).click();

    // Wait for URL to update
    await expect(page).toHaveURL(/\/ris/);

    // Copy to clipboard
    await page.getByRole('button', { name: /copy to clipboard/i }).click();

    // Verify copy success (button text or toast changes)
    await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 5000 });
  });

  test('J1-6: Download citation file', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/abs/2020ApJ...900....1S/exportcitation/bibtex`);

    // Wait for export to be ready
    await expect(page.getByTestId('export-preview')).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await page.getByRole('button', { name: /download to file/i }).click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/export.*\.(bib|txt|ris)$/);
  });
});

test.describe('Journey 1: Full End-to-End Flow', () => {
  // Skip until client-side API mocking is implemented
  test.skip();

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });
  });

  test('Complete journey: Home → Search → Abstract → Library → Export', async ({ page }) => {
    // 1. Start at home page
    await page.goto(`${NECTAR_URL}/`);

    // 2. Perform search
    await page.getByTestId('allSearchTermsInput').fill('exoplanet atmospheres');
    await page.getByTestId('search-submit').click();
    await expect(page).toHaveURL(/\/search/);

    // 3. Click on first result
    await page.waitForSelector('article');
    const firstArticle = page.getByRole('article').first();
    const titleLink = firstArticle.getByRole('link').first();
    await titleLink.click();

    // 4. Verify we're on abstract page
    await expect(page).toHaveURL(/\/abs\/.+\/abstract/);

    // 5. Navigate to export
    await page.getByRole('link', { name: 'Export Citation' }).click();
    await expect(page).toHaveURL(/\/export/);

    // 6. Verify export is shown
    await expect(page.getByText('Exporting record')).toBeVisible();
  });
});
