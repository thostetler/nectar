import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';
import { getTocParams, IDocsEntity, useGetAbstract, useGetToc } from '@/api/search';

const VolumePage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess } = useGetToc(getParams(), {
    enabled: !!getParams && !!doc?.bibcode,
    keepPreviousData: true,
  });

  const tocParams = useMemo(() => {
    if (doc?.bibcode) {
      return getTocParams(doc.bibcode, 0);
    }
  }, [doc]);

  return (
    <AbsLayout doc={doc} titleDescription="Papers in the same volume as">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Volume Content')}</title>
      </Head>
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={tocParams}
        />
      )}
    </AbsLayout>
  );
};

export default VolumePage;
