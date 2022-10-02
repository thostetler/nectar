import { NextPage } from 'next';
import Head from 'next/head';

const LibrariesHome: NextPage = () => {
  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Libraries</title>
      </Head>
      <div>PROTECTED ROUTE</div>
    </div>
  );
};

export default LibrariesHome;

import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  console.log('libraries [session]', req.session);

  return Promise.resolve({
    props: {
      foo: 'string',
    },
  });
};
