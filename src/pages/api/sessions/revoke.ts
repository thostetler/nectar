import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionConfig } from '@/config';
import { SessionStore } from '@/lib/sessionStore';
import { logger } from '@/logger';
import { shouldUseRedisSessions } from '@/lib/featureFlags';

const log = logger.child({}, { msgPrefix: '[api/sessions/revoke] ' });

export interface IRevokeSessionResponse {
  success?: boolean;
  error?: string;
}

async function revokeSession(req: NextApiRequest, res: NextApiResponse<IRevokeSessionResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  try {
    const session = req.session;
    const currentSessionId = session.sessionId as string;
    const useRedis = shouldUseRedisSessions(currentSessionId);

    // This feature only works with Redis sessions
    if (!useRedis) {
      log.debug('Session revocation attempted with Redis disabled');
      return res.status(503).json({
        success: false,
        error: 'session-management-unavailable',
      });
    }

    if (!session.isAuthenticated || !session.token?.username) {
      log.warn({ currentSessionId }, 'Unauthorized session revoke attempt');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'missing-session-id' });
    }

    // Prevent revoking current session (use logout instead)
    if (sessionId === currentSessionId) {
      log.warn({ sessionId, userId: session.token.username }, 'Attempt to revoke current session');
      return res.status(400).json({ success: false, error: 'cannot-revoke-current-session' });
    }

    // Verify session belongs to user
    const targetSession = await SessionStore.get(sessionId);
    if (!targetSession || targetSession.userId !== session.token.username) {
      log.warn({ sessionId, userId: session.token.username }, 'Attempt to revoke session not owned by user');
      return res.status(404).json({ success: false, error: 'session-not-found' });
    }

    const destroyed = await SessionStore.destroy(sessionId);

    if (destroyed) {
      log.info({ sessionId, userId: session.token.username }, 'Session revoked');
      return res.status(200).json({ success: true });
    } else {
      log.error({ sessionId, userId: session.token.username }, 'Failed to revoke session');
      return res.status(500).json({ success: false, error: 'revocation-failed' });
    }
  } catch (err) {
    log.error({ err }, 'Failed to revoke session');
    return res.status(500).json({ success: false, error: 'internal-error' });
  }
}

export default withIronSessionApiRoute(revokeSession, sessionConfig);
