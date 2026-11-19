import { describe, expect, it, vi } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { EmailService } from '../../../shared/domain/email.service';
import { SupabaseAuthEmailThrottleRepository } from '../infrastructure/repositories/supabase-auth-email-throttle.repository';
import { SupabaseAuthRepository } from '../infrastructure/repositories/supabase-auth-repository';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import { SignInWithMagicLinkUseCase } from './sign-in-with-magic-link.use-case';
import { SignUpUseCase } from './sign-up.use-case';

const CONFIRM_URL = 'https://rpg.test/api/auth/confirm';
const PASSWORD = 'ThrottlePass123!';
const PERMISSION_DENIED = '42501';

const admin = SupabaseFactory.createAdmin();

function setup() {
  const email = {
    sendConfirmationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendMagicLinkEmail: vi.fn(),
    sendAccountExistsEmail: vi.fn(),
    sendAccountDeletionEmail: vi.fn(),
    sendPasswordChangedEmail: vi.fn(),
    sendFinishSignUpEmail: vi.fn(),
  } satisfies EmailService;
  // No session is ever read: the admin client stands in for the request's client
  const authRepo = new SupabaseAuthRepository(admin, admin);
  const throttle = new SupabaseAuthEmailThrottleRepository(admin);

  return {
    email,
    authRepo,
    magicLink: new SignInWithMagicLinkUseCase(authRepo, email, throttle),
    reset: new RequestPasswordResetUseCase(authRepo, email, throttle),
    signUp: new SignUpUseCase(authRepo, email, throttle),
  };
}

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 9)}@example.com`;

async function createAccount(prefix: string, confirmed: boolean) {
  const address = uniqueEmail(prefix);
  const { data, error } = await admin.auth.admin.createUser({
    email: address,
    password: PASSWORD,
    email_confirm: confirmed,
  });
  if (error) throw error;
  return { address, userId: data.user.id };
}

/** Moves the account's last e-mails past the interval, as if a minute had gone by. */
async function waitOutInterval(userId: string) {
  const { error } = await admin
    .from('auth_email_throttle')
    .update({ last_sent_at: new Date(Date.now() - 61_000).toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

describe('Intervalo entre os e-mails de entrada (integração)', () => {
  it('link mágico: o segundo pedido seguido não manda nada, e volta a mandar depois do intervalo', async () => {
    const { address, userId } = await createAccount('throttle-magic', true);
    const flow = setup();

    await flow.magicLink.execute(address, CONFIRM_URL);
    await expect(flow.magicLink.execute(address, CONFIRM_URL)).resolves.toBeUndefined();
    expect(flow.email.sendMagicLinkEmail).toHaveBeenCalledTimes(1);

    await waitOutInterval(userId);
    await flow.magicLink.execute(address, CONFIRM_URL);
    expect(flow.email.sendMagicLinkEmail).toHaveBeenCalledTimes(2);
  });

  it('nova senha: o intervalo é por tipo, então o link mágico não segura o de nova senha', async () => {
    const { address } = await createAccount('throttle-reset', true);
    const flow = setup();

    await flow.magicLink.execute(address, CONFIRM_URL);
    await flow.reset.execute(address, CONFIRM_URL);
    await flow.reset.execute(address.toUpperCase(), CONFIRM_URL);

    expect(flow.email.sendMagicLinkEmail).toHaveBeenCalledTimes(1);
    expect(flow.email.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('pedidos simultâneos mandam um e-mail só', async () => {
    const { address } = await createAccount('throttle-race', true);
    const flow = setup();

    await Promise.all(Array.from({ length: 5 }, () => flow.reset.execute(address, CONFIRM_URL)));

    expect(flow.email.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('e-mail sem conta: responde igual, sem e-mail e sem criar conta', async () => {
    const address = uniqueEmail('throttle-ghost');
    const flow = setup();

    await expect(flow.magicLink.execute(address, CONFIRM_URL)).resolves.toBeUndefined();
    await expect(flow.reset.execute(address, CONFIRM_URL)).resolves.toBeUndefined();

    expect(flow.email.sendMagicLinkEmail).not.toHaveBeenCalled();
    expect(flow.email.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(await flow.authRepo.existsByEmail(address)).toBe(false);
  });

  it('cadastro novo começa o intervalo: cadastrar de novo logo em seguida não manda nada', async () => {
    const address = uniqueEmail('throttle-signup');
    const flow = setup();

    await flow.signUp.execute(address, PASSWORD, CONFIRM_URL);
    await expect(flow.signUp.execute(address, PASSWORD, CONFIRM_URL)).resolves.toBeUndefined();

    expect(flow.email.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(flow.email.sendAccountExistsEmail).not.toHaveBeenCalled();
  });

  it('conta confirmada que se cadastra de novo recebe o aviso de que já tem conta, uma vez por intervalo', async () => {
    const { address } = await createAccount('throttle-exists', true);
    const flow = setup();

    await flow.signUp.execute(address, 'OtherPass123!', CONFIRM_URL);
    await flow.signUp.execute(address, 'OtherPass123!', CONFIRM_URL);

    expect(flow.email.sendAccountExistsEmail).toHaveBeenCalledTimes(1);
    expect(flow.email.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  // Account pre-hijacking: someone starts the sign-up with the owner's e-mail and their own
  // password. Confirming must go through choosing a password, so theirs never stays
  it('conta não confirmada que se cadastra de novo: o link confirma e obriga a escolher a senha, que tira a de quem começou', async () => {
    const { address } = await createAccount('throttle-unconfirmed', false);
    const flow = setup();

    await flow.signUp.execute(address, 'OtherPass123!', CONFIRM_URL);

    expect(flow.email.sendAccountExistsEmail).not.toHaveBeenCalled();
    expect(flow.email.sendConfirmationEmail).not.toHaveBeenCalled();
    expect(flow.email.sendFinishSignUpEmail).toHaveBeenCalledTimes(1);
    // The password set at sign-up stops working at once, even if the link is never finished
    expect(await flow.authRepo.verifyPassword(address, PASSWORD)).toBe(false);

    // The link is a recovery one: opening it confirms the e-mail and starts a session
    const link = new URL(flow.email.sendFinishSignUpEmail.mock.calls[0][1]);
    expect(link.searchParams.get('type')).toBe('recovery');
    const owner = SupabaseFactory.createAnon();
    const { error } = await owner.auth.verifyOtp({
      token_hash: link.searchParams.get('token_hash')!,
      type: 'recovery',
    });
    expect(error).toBeNull();
    expect(await flow.authRepo.isEmailConfirmed(address)).toBe(true);

    // The owner chooses the password (what /reset-password does), and the first one stops working
    const { error: updateError } = await owner.auth.updateUser({ password: 'OwnersPass456!' });
    expect(updateError).toBeNull();
    expect(await flow.authRepo.verifyPassword(address, 'OwnersPass456!')).toBe(true);
    expect(await flow.authRepo.verifyPassword(address, PASSWORD)).toBe(false);
    expect(await flow.authRepo.verifyPassword(address, 'OtherPass123!')).toBe(false);
  });

  it('link mágico para conta não confirmada também manda confirmar e escolher a senha', async () => {
    const { address } = await createAccount('throttle-unconfirmed-magic', false);
    const flow = setup();

    await flow.magicLink.execute(address, CONFIRM_URL);

    expect(flow.email.sendMagicLinkEmail).not.toHaveBeenCalled();
    expect(flow.email.sendFinishSignUpEmail).toHaveBeenCalledTimes(1);
    expect(await flow.authRepo.verifyPassword(address, PASSWORD)).toBe(false);

    // The link sent is the newest one, and it still works after the password was replaced
    const link = new URL(flow.email.sendFinishSignUpEmail.mock.calls[0][1]);
    expect(link.searchParams.get('type')).toBe('recovery');
    const { error } = await SupabaseFactory.createAnon().auth.verifyOtp({
      token_hash: link.searchParams.get('token_hash')!,
      type: 'recovery',
    });
    expect(error).toBeNull();
  });

  it('a chave pública não alcança a tabela nem as funções', async () => {
    const anon = SupabaseFactory.createAnon();

    const [claim, confirmed, table] = await Promise.all([
      anon.rpc('claim_auth_email', { p_email: 'someone@example.com', p_kind: 'magiclink' }),
      anon.rpc('auth_user_email_confirmed', { p_email: 'someone@example.com' }),
      anon.from('auth_email_throttle').select('user_id'),
    ]);

    expect(claim.error?.code).toBe(PERMISSION_DENIED);
    expect(confirmed.error?.code).toBe(PERMISSION_DENIED);
    expect(table.error?.code).toBe(PERMISSION_DENIED);
  });
});
