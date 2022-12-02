import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import { SimpleLink } from '@components';
import { useSession } from '@hooks/useSession';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCookies } from 'react-cookie';
import { FormEvent, useCallback, useMemo, useState } from 'react';
import { APP_DEFAULTS } from '@config';
import { ZodError } from 'zod';
import { IUserCredentials } from '@hooks/useSession/types';
export { userGSSP as getServerSideProps } from '@utils';

// get remember-email cookie name from config
const cookieName = APP_DEFAULTS.USER_MASKED_EMAIL_COOKIE;

// get hold of actual error object from validation error list
const getError = (name: string, error: string | ZodError<IUserCredentials>) => {
    if (error && typeof error !== 'string' && error.issues) {
      return error.issues.find(i => i.path.includes(name));
    }
  };

const Login: NextPage = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoggingIn } = useSession();
  const [cookies] = useCookies([cookieName]);
  const [email, setEmail] = useState(cookies[cookieName] as string ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | ZodError<IUserCredentials>>(null);
  const [remember, setRemember] = useState(() => typeof cookies[cookieName] === 'string');

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const result = await login({ email, password, remember });
      if (result.error) {
        setError(result.error);
      }
    },
    [login, email, password, remember],
  );

  const emailError = useMemo(() => getError('email', error), [error]);  
  const passwordError = useMemo(() => getError('password', error), [error]);  

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Welcome!</Heading>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Stack direction="column" spacing={4}>
            <FormControl isInvalid={!!emailError}>
              <FormLabel>Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={(e) => setEmail(e.currentTarget.value)}
                value={email}
                autoFocus
              />
              <FormErrorMessage>{emailError?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!passwordError}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="********"
                name="password"
                id="password"
                onChange={(e) => setPassword(e.currentTarget.value)}
                value={password}
              />
              <FormErrorMessage>{passwordError?.message}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <Checkbox
                name="rememberemail"
                id="rememberemail"
                isChecked={remember}
                onChange={(e) => setRemember(e.currentTarget.checked)}
              >
                Remember Email?
              </Checkbox>
            </FormControl>
              
            <Button type="submit" isLoading={isLoggingIn} disabled={isLoggingIn}>Login with email</Button>
            <SimpleLink alignSelf="center" href="/user/account/register">
              Register
            </SimpleLink>

            <Box alignSelf="center">
              Forgot{' '}
              <SimpleLink display="inline" href="/user/account/recover-username">
                username
              </SimpleLink>{' '}
              or{' '}
              <SimpleLink display="inline" href="/user/account/reset-password">
                password
              </SimpleLink>
              ?
            </Box>
            {error && typeof error === 'string' && (
              <Alert status="error" flexDir="column">
                <AlertTitle>Unable to login user</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </div>
  );
};

export default Login;
