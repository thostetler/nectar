import { getSimilarParams, IDocsEntity, useGetAbstract, useGetSimilar } from '@/api';
import { AbstractRefList } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { composeNextGSSP } from '@/ssr-utils';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';

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

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);
