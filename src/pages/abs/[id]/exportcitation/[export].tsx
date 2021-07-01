import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

enum ExportType {
  BIBTEX = 'bibtex',
}

interface IExportCitationPageProps {
  exportType: ExportType;
}

const BasicPage: NextPage<IExportCitationPageProps> = (props) => {
  console.log(props);
  return <div>basic page</div>;
};

export default BasicPage;

export const getServerSideProps: GetServerSideProps<IExportCitationPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);

  console.log({ query });

  // const request = ctx.req as typeof ctx.req & {
  //   session: { userData: IADSApiBootstrapData };
  // };
  // const userData = request.session.userData;
  // const params: IADSApiSearchParams = {
  //   q: `citations(identifier:${query.id})`,
  //   fl: ['bibcode', 'title', 'author', '[fields author=3]', 'author_count', 'pubdate'],
  //   sort: ['date desc'],
  // };
  // const adsapi = new AdsApi({ token: userData.access_token });
  // const mainResult = await adsapi.search.query(params);
  // const originalDoc = await getOriginalDoc(adsapi, query.id);

  // console.log(
  //   mainResult.isErr() ? (axios.isAxiosError(mainResult.error) ? mainResult.error.response.data : null) : null,
  // );

  // if (mainResult.isErr()) {
  //   return { props: { docs: [], originalDoc, error: mainResult.error.message } };
  // }

  return {
    props: {
      exportType: ExportType.BIBTEX,
    },
  };
};
