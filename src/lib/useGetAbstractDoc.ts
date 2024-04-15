import { useGetAbstract } from '@/api/search';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { logger } from '@/logger';

/**
 * helper hook for getting hold of the primary doc
 */
export const useGetAbstractDoc = (id?: string) => {
  const router = useRouter();
  const docId = typeof id === 'string' ? id : Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  logger.debug({ msg: 'useGetAbstractDoc', docId });
  // this *should* only ever fetch from pre-filled cache
  const { data, ...res } = useGetAbstract({ id: docId }, { keepPreviousData: true });

  logger.debug({ msg: 'useGetAbstractDoc', data, ...res });

  const doc = data?.docs?.[0] ?? {};

  useEffect(() => {
    if (doc?.bibcode) {
      void router.replace(`/abs/${doc.bibcode}/abstract`, null, { shallow: true });
    }
  }, [doc?.bibcode]);

  return { doc, data, ...res };
};
