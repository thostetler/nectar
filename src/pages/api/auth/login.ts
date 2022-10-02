import { ApiTargets, IUserLoginResponse } from '@api';
import { defaultRequestConfig } from '@api/config';
import axios, { AxiosRequestConfig } from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

type LoginData = {
  error?: string;
};

type Creds = { email: string; password: string; csrf: string };

const authorizeUser = async (creds: Creds, req: NextApiRequest) => {
  // console.log(creds.csrf, req.cookies.session);
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    url: ApiTargets.USER,
    method: 'POST',
    data: {
      username: creds.email,
      password: creds.password,
    },
    xsrfCookieName: 'X-CSRFToken',
    headers: {
      Authorization: `Bearer ${req.session.userData.access_token}`,
      'X-CSRFToken': creds.csrf,
      Cookie: `session=${req.cookies.session}`,
    },
  };

  console.log(config);

  try {
    const { data } = await axios.request<IUserLoginResponse>(config);
    console.log('data', data);
    return data.message === 'success';
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IUserLoginResponse).error;
    }
    return false;
  }
};

export default async function (req: NextApiRequest, res: NextApiResponse<LoginData>) {
  const { email, password, csrf } = req.body as Creds;

  // console.log('session', req.session.adsSession);
  const result = await authorizeUser({ email, password, csrf }, req);
  if (result === true) {
    res.status(200);
  } else if (typeof result === 'string') {
    res.status(401).json({ error: result });
  } else {
    res.status(401).json({ error: 'Unable to login user' });
  }
}
