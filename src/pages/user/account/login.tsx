import { IUserCredentials } from '@api';
import { Button, Container, FormControl, FormLabel, Heading, Input, InputGroup, Stack } from '@chakra-ui/react';
import { PasswordTextInput, SimpleLink } from '@components';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { FormEventHandler, useState } from 'react';
import { useFocus } from '@lib/useFocus';
import { getCsrfToken, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { getServerSession } from 'next-auth';
import { authOptions } from '@pages/api/auth/[...nextauth]';
import { logger } from '@logger';

const initialParams: IUserCredentials = { email: '', password: '' };

export default function LoginPage({ csrfToken }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [params, setParams] = useState<IUserCredentials>(initialParams);
  const [mainInputRef, focus] = useFocus<HTMLInputElement>();

  const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    setParams((prevParams) => ({ ...prevParams, [name]: value }));
  };

  const callbackUrl = Array.isArray(router.query.callbackUrl)
    ? router.query.callbackUrl[0]
    : router.query.callbackUrl ?? '';
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      await signIn(
        'login',
        {
          redirect: false,
          email: params.email,
          password: params.password,
          csrfToken,
        },
        {
          callbackUrl,
        },
      );
    } catch (error) {
      logger.error({ msg: 'login error', error });
    }
  };

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" id="form-label" alignSelf="center" my="6">
          Login
        </Heading>

        <form method="post" onSubmit={handleSubmit} aria-labelledby="form-label">
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                ref={mainInputRef}
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                autoFocus
                onChange={handleChange}
                value={params.email}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <PasswordTextInput
                  name="password"
                  id="password"
                  pr="4.5rem"
                  onChange={handleChange}
                  value={params.password}
                />
              </InputGroup>
            </FormControl>
            <SimpleLink alignSelf="flex-end" href="/user/account/forgotpassword">
              Forgot password?
            </SimpleLink>
            {/* show loading indicator even after success, since we should be awaiting a page refresh */}
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </Container>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (session?.user?.isLoggedIn) {
    return { redirect: { destination: '/', permanentRedirect: false } };
  }

  const csrfToken = await getCsrfToken(ctx);
  return {
    props: { csrfToken: csrfToken ?? null },
  };
}
