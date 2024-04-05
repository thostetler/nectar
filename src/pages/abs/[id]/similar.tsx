import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import Head from 'next/head';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';
import { getSimilarParams, IDocsEntity, useGetAbstract, useGetSimilar } from '@/api/search';

const SimilarPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);
  const { data, isSuccess } = useGetSimilar(getParams(), { keepPreviousData: true });
  const similarParams = getSimilarParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Similar')}</title>
      </Head>
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={similarParams}
        />
      )}
    </AbsLayout>
  );
};

export default SimilarPage;
