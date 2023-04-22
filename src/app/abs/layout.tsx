import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { IronSession, unsealData } from 'iron-session';
import { sessionConfig } from '@config';
import { IBootstrapPayload } from '@api/user/types';
import { ApiTargets } from '@api/models';
import { getAbstractParams } from '@api/search/models';
import { stringifySearchParams } from '@utils';

const getAbstract = async (id: string) => {
  const cookie = cookies().get(process.env.SCIX_SESSION_COOKIE_NAME);
  console.log('cookie', cookie);
  if (!cookie) {
    return null;
  }
  const session = await unsealData<IronSession>(cookie.value, sessionConfig);
  console.log('session', session);
  const params = stringifySearchParams({
    ...getAbstractParams(id ?? '2023RvMPP...7...18C'),
    omitHeader: 'true',
    wt: 'json',
    fl: '',
  });
  const url = `${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}?${params.toString()}`;
  console.log(url);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer:${session?.token?.access_token}`,
    },
  });
  return (await res.json()) as IBootstrapPayload;
};

const AbstractPageLayout = async ({ children, params }: { children: ReactNode; params: { id: string } }) => {
  console.log('params', params);
  const doc = await getAbstract(params.id);
  console.log('doc', doc);
  return <section>{children}</section>;
};

export default AbstractPageLayout;
