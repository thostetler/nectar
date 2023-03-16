import { isAuthenticated, isUserData, IUserData } from '@api';
import { changeAPIToken } from '@auth-utils';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface ITokenPayload {
  success?: boolean;
  error?: string;
  user?: IUserData;
}

export default async function (req: NextApiRequest, res: NextApiResponse<ITokenPayload>) {
  if (req.method === 'POST') {
    const result = await changeAPIToken(req, res);

    if (typeof result === 'string') {
      // login request failed with an error code
      return res.status(200).json({ success: false, error: result });
    } else if (result && isUserData(result)) {
      // success! user is logged in, and we have the new
      req.session.userData = result;
      req.session.isAuthenticated = isAuthenticated(result);
      return res.status(200).json({ success: true, user: result });
    }
    return res.status(200).json({ success: false, error: 'Could not change token, unknown server issue' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
