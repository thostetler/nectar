import { Box, Flex } from '@chakra-ui/react';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { NextPage } from 'next';
import Head from 'next/head';
import NextImage from 'next/legacy/image';
import { LoadingMessage, SimpleLink } from '@/components';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { getDetailsPageTitle } from '@/pages/abs/[id]/abstract';
import { IDocsEntity, useGetAbstract } from '@/api/search';
import { useGetGraphics } from '@/api/graphics';

const GraphicsPage: NextPage = () => {
  const router = useRouter();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  const {
    data: graphics,
    isLoading,
    isError,
    isSuccess,
  } = useGetGraphics(doc?.bibcode, { enabled: !!doc?.bibcode, keepPreviousData: true, retry: false });
  return (
    <AbsLayout doc={doc} titleDescription="Graphics from">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Graphics')}</title>
      </Head>
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch graphics
        </Box>
      )}
      {!isError && !isLoading && !graphics && (
        <Box mt={5} fontSize="xl">
          No graphics
        </Box>
      )}
      {isLoading && <LoadingMessage message="Loading" />}
      {isSuccess && graphics && (
        <>
          <Box dangerouslySetInnerHTML={{ __html: graphics.header }}></Box>
          <Flex wrap="wrap">
            {graphics.figures.map((figure) => {
              return (
                <Flex
                  key={figure.figure_label}
                  direction="column"
                  alignItems="center"
                  borderWidth={1}
                  borderColor="gray.100"
                  borderRadius="md"
                  p={2}
                  m={2}
                  as={SimpleLink}
                  href={figure.images[0].highres}
                  isExternal
                >
                  <NextImage src={figure.images[0].thumbnail} width="150" height="150" alt={figure.figure_label} />
                  <Box aria-hidden="true">{figure.figure_label}</Box>
                </Flex>
              );
            })}
          </Flex>
        </>
      )}
    </AbsLayout>
  );
};

export default GraphicsPage;
