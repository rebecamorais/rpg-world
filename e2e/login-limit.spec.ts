import { expect, hydrated, test } from './support/fixtures';
import { PASSWORD, createUser, uniqueEmail } from './support/supabase';

const WRONG = 'not-the-password';
const LOCKED = /Too many sign-in attempts\. Wait 15 minutes and try again/;

/**
 * A client IP of its own (TEST-NET-3), so this test's wrong passwords never count against the IP
 * every other test signs in from. Outside Vercel nothing rewrites x-forwarded-for.
 */
const ownIp = () => `203.0.113.${Math.floor(Math.random() * 254) + 1}`;

test.describe('limite de tentativas no login', () => {
  test('depois de 5 senhas erradas, a 6ª tentativa espera, mesmo com a senha certa', async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ 'x-forwarded-for': ownIp() });
    const user = await createUser('login-limit');
    await page.goto('/login');

    await (await hydrated(page.getByLabel('Email'))).fill(user.email);
    const password = page.getByLabel('Password');
    const submit = page.getByRole('button', { name: 'Sign in', exact: true });
    const form = page.locator('form');

    for (let attempt = 1; attempt <= 5; attempt++) {
      await password.fill(WRONG);
      const answer = page.waitForResponse('**/api/auth/login');
      await submit.click();
      expect((await answer).status()).toBe(400);
      await expect(form.getByText('Incorrect email or password.')).toBeVisible();
    }

    await password.fill(PASSWORD);
    await submit.click();

    await expect(form.getByText(LOCKED)).toBeVisible();
    await expect(form.getByText('Incorrect email or password.')).toBeHidden();
    await expect(page).toHaveURL((url) => url.pathname === '/login');
  });

  test('um e-mail sem conta trava igual, então a resposta não diz se a conta existe', async ({
    page,
  }) => {
    const headers = { 'x-forwarded-for': ownIp() };
    const data = { email: uniqueEmail('login-limit-ghost'), password: WRONG };

    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await page.request.post('/api/auth/login', { data, headers });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: 'auth_error_signin_invalid_credentials' });
    }

    const res = await page.request.post('/api/auth/login', { data, headers });
    expect(res.status()).toBe(429);
    expect(await res.json()).toEqual({
      error: 'auth_error_signin_too_many_attempts',
      retryAfterMinutes: 15,
    });
  });
});
