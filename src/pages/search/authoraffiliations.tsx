import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, Container as Box } from '@chakra-ui/react';
import { AuthorAffiliations, SimpleLink } from '@/components';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { parseQueryFromUrl } from '@/utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const AuthorAffiliationsPage: NextPage = () => {
  const { getSearchHref, show: showBackLink } = useBackToSearchResults();
  const router = useRouter();
  const query = parseQueryFromUrl<{ qid: string; format: string }>(router.asPath, { sortPostfix: 'id asc' });

  return (
    <>
      {showBackLink && (
        <Button as={SimpleLink} href={getSearchHref()} variant="outline" leftIcon={<ChevronLeftIcon />} mt="4">
          Back to Results
        </Button>
      )}

      <Box
        as="section"
        maxW="container.xl"
        mt={showBackLink ? 0 : 4}
        mb="4"
        aria-labelledby="author-affiliation-title"
        data-testid="author-aff-container"
        centerContent
      >
        <AuthorAffiliations query={query} w="full" maxW="container.lg" />
      </Box>
    </>
  );
};

export default AuthorAffiliationsPage;
