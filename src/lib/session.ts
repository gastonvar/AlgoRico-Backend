import { Op } from 'sequelize';
import { env } from '../config/env.js';
import { createCsrfToken, generateSessionToken, hashToken } from './crypto.js';
import { Session, User } from '../models/index.js';

export async function createUserSession(userId: string): Promise<{
  session: Session;
  sessionToken: string;
  csrfToken: string;
}> {
  const sessionToken = generateSessionToken();
  const session = await Session.create({
    userId,
    tokenHash: hashToken(sessionToken),
    expiresAt: new Date(Date.now() + env.SESSION_TTL_MS),
  });

  return {
    session,
    sessionToken,
    csrfToken: createCsrfToken(sessionToken, env.SESSION_SECRET),
  };
}

export async function findValidSession(sessionToken: string): Promise<{
  session: Session;
  user: User;
} | null> {
  const session = await Session.findOne({
    where: {
      tokenHash: hashToken(sessionToken),
      expiresAt: { [Op.gt]: new Date() },
    },
    include: [{ model: User, as: 'user' }],
  });

  if (!session) {
    return null;
  }

  const user = session.get('user') as User | undefined;
  if (!user?.active) {
    return null;
  }

  return { session, user };
}

export async function destroySession(sessionId: string): Promise<void> {
  await Session.destroy({ where: { id: sessionId } });
}

export async function destroyExpiredSessions(): Promise<void> {
  await Session.destroy({ where: { expiresAt: { [Op.lte]: new Date() } } });
}

export function csrfTokenFor(sessionToken: string): string {
  return createCsrfToken(sessionToken, env.SESSION_SECRET);
}
