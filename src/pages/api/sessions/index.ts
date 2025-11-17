import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionConfig } from '@/config';
import { SessionStore } from '@/lib/sessionStore';
import { logger } from '@/logger';
import { shouldUseRedisSessions } from '@/lib/featureFlags';

const log = logger.child({}, { msgPrefix: '[api/sessions] ' });

export interface ISessionsResponse {
  success?: boolean;
  sessions?: Array<{
    sessionId: string;
    createdAt: number;
    lastActivity: number;
    userAgent?: string;
    ip?: string;
    current: boolean;
  }>;
  error?: string;
}

async function sessions(req: NextApiRequest, res: NextApiResponse<ISessionsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  try {
    const session = req.session;
    const sessionId = session.sessionId as string;
    const useRedis = shouldUseRedisSessions(sessionId);

    // This feature only works with Redis sessions
    if (!useRedis) {
      log.debug('Session listing attempted with Redis disabled');
      return res.status(503).json({
        success: false,
        error: 'session-management-unavailable',
      });
    }

    if (!session.isAuthenticated || !session.token?.username) {
      log.warn({ sessionId }, 'Unauthorized session list attempt');
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const userId = session.token.username;
    const currentSessionId = sessionId;

    const userSessions = await SessionStore.getUserSessions(userId);

    const sessions = userSessions.map((s) => ({
      sessionId: s.sessionId,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
      userAgent: s.userAgent,
      ip: s.ip,
      current: s.sessionId === currentSessionId,
    }));

    log.info({ userId, count: sessions.length }, 'Retrieved user sessions');
    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    log.error({ err }, 'Failed to retrieve sessions');
    return res.status(500).json({ success: false, error: 'internal-error' });
  }
}

export default withIronSessionApiRoute(sessions, sessionConfig);
