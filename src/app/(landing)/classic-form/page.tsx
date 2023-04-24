'use client';
import Head from 'next/head';
import { ClassicForm } from '@components/ClassicForm';
import { Box } from '@chakra-ui/layout';
import { NextPage } from 'next';

const Page: NextPage<{ ssrError?: string }> = ({ ssrError }) => {
  return (
    <Box as="section" aria-labelledby="form-title" my={16}>
      <Head>
        <title>NASA Science Explorer - Classic Form Search</title>
      </Head>
      <ClassicForm ssrError={ssrError} />
    </Box>
  );
};

export default Page;
