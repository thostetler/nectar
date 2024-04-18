import { NextApiHandler } from 'next';
import { HttpStatusCode } from 'axios';
import { NoSession } from '@/error';
import { logger } from '@/logger';
import { IronSession } from 'iron-session';
import { getSessionConfig } from '@/config';
import { isEmpty } from 'ramda';
import { getIronSession } from 'iron-session/edge';
import { bootstrapUser } from '@/auth';

export type AuthSession = Partial<{
  auth: {
    apiToken: string;
    isAuthenticated: boolean;
  };
  user: {
    email: string;
  };
}> & {
  isOk: boolean;
  error: string;
};

const log = logger.child({}, { msgPrefix: '[auth/session] ' });
const handler: NextApiHandler<AuthSession> = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const session = await getIronSession(req, res, getSessionConfig());
      log.debug({ msg: 'GET Session', session });

      if (isEmpty(session)) {
        log.debug({ msg: 'Session not found', session });
        res.status(HttpStatusCode.Ok).json({
          isOk: false,
          error: 'NoSession',
        });
      }

      res.status(HttpStatusCode.Ok).json(formatSession(session));
    } else if (req.method === 'POST') {
      const user = await bootstrapUser(req, res);

      if (!user) {
        log.error({ msg: '' });
        return res.status(HttpStatusCode.Forbidden).json({
          isOk: false,
          error: '',
        });
      }

      const session = await getIronSession(req, res, getSessionConfig());
      log.debug({ msg: 'POST Session', session });
      session.user = {
        email: user.username,
      };
      session.auth = {
        apiToken: user.access_token,
        isAuthenticated: !user.anonymous,
        expires: user.expire_in,
      };
      await session.save();

      log.debug({ msg: 'Session created', session });

      res.status(HttpStatusCode.Ok).json(formatSession(session));
    }
    return res.status(HttpStatusCode.Forbidden).json({
      isOk: false,
      error: 'MethodNotAllowed',
    });
  } catch (error) {
    log.error({ msg: 'Failed to get session', error });
    return res.status(HttpStatusCode.InternalServerError).json({
      isOk: false,
      error: (error as Error).name,
    });
  }
};

const formatSession = (payload: IronSession) => {
  if (!payload) {
    throw new NoSession();
  }
  return {
    auth: {
      apiToken: payload.auth.apiToken,
      isAuthenticated: payload.auth.isAuthenticated,
    },
    user: {
      email: payload.user.email,
    },
    isOk: true,
  } as AuthSession;
};

export default handler;
