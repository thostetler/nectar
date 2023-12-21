import { IronSession } from 'iron-session';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextRequest, NextResponse } from 'next/server';
import { ApiTargets } from '../api/models';
import { IVerifyAccountResponse } from '../api/user/types';
import { redirect } from '@__middleware/common';

/**
 * Handles the response after verifying requests.
 *
 * @param {NextRequest} req - The NextRequest object representing the incoming request.
 * @param {NextResponse} res - The NextResponse object representing the outgoing response.
 * @param {IronSession} session - The IronSession object used for session management.
 *
 * @returns {Promise<NextResponse>} The NextResponse object representing the outgoing response.
 */
export const handleVerifyResponse = async (
  req: NextRequest,
  res: NextResponse,
  session: IronSession,
): Promise<NextResponse> => {
  // verify requests have a token we need to send to the API
  try {
    const [, , , , route, token] = req.nextUrl.pathname.split('/');

    if (route === 'change-email' || route === 'register') {
      // we need to verify the token, and then pass the authenticated session to home page.
      // the middleware should run on the home page and bootstrap the session
      return await verify({ token, session, res, req });
    } else if (route === 'reset-password') {
      // reset password needs to prompt for a new password, allow the request to continue
      return res;
    }
  } catch (e) {
    return NextResponse.redirect(new URL('/', req.url), res);
  }
};

/**
 * Verify the account using the provided token.
 * Redirect the user to a new URL with a message depending on the verification status.
 *
 * @param {Object} options - The options object.
 * @param {string} options.token - The verification token.
 * @param {NextRequest} options.req - The Next.js request object.
 * @param {NextResponse} options.res - The Next.js response object.
 * @param {IronSession} options.session - The IronSession object.
 * @returns {Promise<NextResponse>} - The Next.js response object.
 */
const verify = async (options: {
  token: string;
  req: NextRequest;
  res: NextResponse;
  session: IronSession;
}): Promise<NextResponse> => {
  const { req, res, session, token } = options;
  // get a new url ready to go, we'll redirect with a message depending on status
  const url = req.nextUrl.clone();

  try {
    const verifyUrl = `${process.env.API_HOST_SERVER}${ApiTargets.VERIFY}/${token}`;
    const headers = new Headers({
      authorization: `Bearer:${session.token.access_token}`,
      cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value}`,
    });

    const result = await fetch(verifyUrl, {
      method: 'GET',
      headers,
    });

    const json = (await result.json()) as IVerifyAccountResponse;

    if (json.message === 'success') {
      // apply the session cookie to the response
      res.headers.set('set-cookie', result.headers.get('set-cookie'));

      return redirect({
        url,
        res,
        path: '/',
        notifyID: 'verify-account-success',
      });
    }

    // known error messages
    if (json?.error.indexOf('unknown verification token') > -1) {
      return redirect({
        res,
        url,
        path: '/',
        notifyID: 'verify-account-failed',
      });
    }

    if (json?.error.indexOf('already been validated') > -1) {
      return redirect({
        res,
        url,
        path: '/',
        notifyID: 'verify-account-was-valid',
      });
    }

    // unknown error
    return NextResponse.redirect(url, { status: 307, ...res });
  } catch (e) {
    return redirect({
      res,
      url,
      path: '/',
      notifyID: 'verify-account-was-valid',
    });
  }
};
