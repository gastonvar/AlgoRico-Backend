import { AppError } from '../../errors/app-error.js';
import { verifyPassword } from '../../lib/crypto.js';
import { createUserSession, destroySession } from '../../lib/session.js';
import { User } from '../../models/index.js';
import { toPublicUser, type PublicUser } from './auth.mappers.js';
import type { LoginBody } from './auth.schemas.js';

export async function loginUser(input: LoginBody): Promise<{
  user: PublicUser;
  sessionToken: string;
  csrfToken: string;
}> {
  const user = await User.findOne({ where: { email: input.email.toLowerCase() } });
  if (!user || !user.active) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const session = await createUserSession(user.id);
  return {
    user: toPublicUser(user),
    sessionToken: session.sessionToken,
    csrfToken: session.csrfToken,
  };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await User.findByPk(userId);
  if (!user || !user.active) {
    throw AppError.unauthorized();
  }
  return toPublicUser(user);
}

export async function logoutUser(sessionId: string): Promise<void> {
  await destroySession(sessionId);
}
