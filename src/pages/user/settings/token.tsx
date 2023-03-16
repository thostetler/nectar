import {
  Alert,
  AlertDescription,
  AlertTitle,
  Code,
  Input,
  InputGroup,
  InputRightAddon,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { CopyButton, SettingsLayout, SimpleLink } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useSession } from '@hooks/auth';
import { useChangeToken } from '@hooks/auth/useChangeToken';
import { useEffect, useState } from 'react';
import { Button } from '@chakra-ui/button';
import { InputLeftElement } from '@chakra-ui/input';

const ApiTokenPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const toast = useToast({ position: 'bottom' });
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string>(null);
  const { user } = useSession();
  const handleTokenChange = () => setChanging(true);
  const { result } = useChangeToken({ enabled: changing });

  useEffect(() => {
    if (result) {
      // stop loading state
      setChanging(false);

      if (result.ok) {
        toast({ title: 'API token updated successfully!' });
      }

      if (result.error) {
        setError(result.error);
      }
    }
  }, [result]);

  useEffect(() => {
    if (changing) {
      setError(null);
    }
  }, [changing]);

  const codeSnippet = `curl --header 'Authorization: Bearer ${user.access_token}' --location 'https://api.adsabs.harvard.edu/v1/search/query?q=star&sort=date%2520desc%252Cbibcode%2520desc&fl=bibcode'`;

  return (
    <SettingsLayout title="API Token">
      <Stack direction="column" gap={2}>
        <InputGroup size="md">
          <Input type="text" name="token" id="token" value={user.access_token} autoFocus isReadOnly />
          <InputLeftElement>
            <CopyButton text={user.access_token} />
          </InputLeftElement>
          <InputRightAddon
            onClick={handleTokenChange}
            isLoading={changing}
            as={Button}
            bgColor="blue.500"
            color="gray.50"
            borderColor="blue.500"
            borderRightRadius="sm"
          >
            Generate new token
          </InputRightAddon>
        </InputGroup>
        {error ? (
          <Alert status="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Text>
          This API token allows you to access ADS data programmatically. For instance, to fetch the first few bibcodes
          for the query "star", make the following request:
        </Text>
        <Code my={2} display="flex">
          {codeSnippet}
          <CopyButton text={codeSnippet} />
        </Code>
        <Text as="i">
          (If you've generated a token, you can copy-paste the preceding line directly into your terminal)
        </Text>
        <Text>
          Documentation on how to use the API is available on the
          <SimpleLink href="https://github.com/adsabs/adsabs-dev-api#access-settings" newTab display="inline">
            {' '}
            ADS API Github repo
          </SimpleLink>
        </Text>
        <Text>
          Make sure to keep your API key secret to protect it from abuse. If your key has been exposed publicly (say, by
          accidentally being committed to a Github repo) you can generate a new one by clicking on the button above.
        </Text>
      </Stack>
    </SettingsLayout>
  );
};

export default ApiTokenPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  return Promise.resolve({
    props: {},
  });
}, userGSSP);
