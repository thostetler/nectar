import { cookies } from 'next/headers';
import { IronSession, unsealData } from 'iron-session';
import { sessionConfig } from '@config';
import { stringifySearchParams } from '@utils';
import { ApiTargets } from '@api/models';
import { IBootstrapPayload } from '@api/user/types';
import { getAbstractParams } from '@api/search/models';

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

const AbstractPage = async ({ params }: { params: { id: string } }) => {
  console.log('params', params);
  const doc = await getAbstract(params?.id);
  return <pre>{JSON.stringify(doc, null, 2)}</pre>;
};

export default AbstractPage;
