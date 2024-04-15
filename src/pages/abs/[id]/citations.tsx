import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { InferGetServerSidePropsType, NextPage } from 'next';
import Head from 'next/head';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';
import { getCitationsParams, useGetCitations } from '@/api/search';
import { getDetailsPageGSSP } from '@/lib/getDetailsPageGSSP';
import { useGetAbstractDoc } from '@/lib';

const CitationsPage: NextPage<InferGetServerSidePropsType<typeof getDetailsPageGSSP>> = () => {
  const { doc, error: abstractError } = useGetAbstractDoc();
  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  // get the primary response from server (or cache)
  const { data, isSuccess, error: citationsError } = useGetCitations(getParams(), { keepPreviousData: true });
  const citationsParams = getCitationsParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers that cite">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Citations')}</title>
      </Head>
      {(abstractError || citationsError) && (
        <Alert status="error">
          <AlertIcon />
          {abstractError?.message || citationsError?.message}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={citationsParams}
        />
      )}
    </AbsLayout>
  );
};

export default CitationsPage;
export { getDetailsPageGSSP as getServerSideProps } from '@/lib/getDetailsPageGSSP';
