import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';
import { getReferencesParams, IDocsEntity, useGetAbstract, useGetReferences } from '@/api/search';

const ReferencesPage: NextPage = () => {
  const router = useRouter();
  const { data: abstractDoc, error: abstractError } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractDoc);

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);
  const { data, isSuccess, error: referencesError } = useGetReferences(getParams(), { keepPreviousData: true });
  const referencesParams = getReferencesParams(doc?.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Paper referenced by">
      <Head>
        <title>{getDetailsPageTitle(doc, 'References')}</title>
      </Head>
      {(abstractError || referencesError) && (
        <Alert status="error">
          <AlertIcon />
          {abstractError?.message || referencesError?.message}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={referencesParams}
        />
      )}
    </AbsLayout>
  );
};

export default ReferencesPage;
