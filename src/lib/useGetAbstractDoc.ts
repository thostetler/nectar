import { useGetAbstract } from '@/api/search';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * helper hook for getting hold of the primary doc
 */
export const useGetAbstractDoc = (id?: string) => {
  const router = useRouter();
  const docId = typeof id === 'string' ? id : Array.isArray(router.query.id) ? router.query.id[0] : router.query.id;

  // this *should* only ever fetch from pre-filled cache
  const { data, ...res } = useGetAbstract({ id: docId }, { keepPreviousData: true });

  const doc = data?.docs?.[0] ?? {};

  // If the url has a non-bibcode identifier, then update with the correct bibcode
  useEffect(() => {
    if (doc?.bibcode && docId !== doc.bibcode) {
      const newUrl = router.pathname.replace('[id]', doc.bibcode);
      void router.replace(newUrl, newUrl, { shallow: true });
    }
  }, [doc?.bibcode, docId, router.pathname]);

  return { doc, data, ...res };
};
