import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionConfig } from '@/config';
import { SessionStore } from '@/lib/sessionStore';
import { logger } from '@/logger';
import { shouldUseRedisSessions } from '@/lib/featureFlags';

const log = logger.child({}, { msgPrefix: '[api/sessions/revoke-all] ' });

export interface IRevokeAllSessionsResponse {
  success?: boolean;
  count?: number;
  error?: string;
}

async function revokeAllSessions(req: NextApiRequest, res: NextApiResponse<IRevokeAllSessionsResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  try {
    const session = req.session;
    const currentSessionId = session.sessionId as string;
    const useRedis = shouldUseRedisSessions(currentSessionId);

    // This feature only works with Redis sessions
    if (!useRedis) {
      log.debug('Session revoke-all attempted with Redis disabled');
      return res.status(503).json({
        success: false,
        error: 'session-management-unavailable',
      });
    }

    if (!session.isAuthenticated || !session.token?.username) {
      log.warn({ currentSessionId }, 'Unauthorized revoke-all attempt');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const userId = session.token.username;

    // Revoke all sessions except current
    const count = await SessionStore.destroyAllUserSessions(userId, currentSessionId);

    log.info({ userId, count, currentSessionId }, 'All other sessions revoked');
    return res.status(200).json({ success: true, count });
  } catch (err) {
    log.error({ err }, 'Failed to revoke all sessions');
    return res.status(500).json({ success: false, error: 'internal-error' });
  }
}

export default withIronSessionApiRoute(revokeAllSessions, sessionConfig);
