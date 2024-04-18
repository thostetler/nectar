import { Alert, Button, Container, FormControl, FormLabel, Heading, Input, InputGroup, Stack } from '@chakra-ui/react';
import { PasswordTextInput, SimpleLink } from '@/components';
import Head from 'next/head';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { useFocus } from '@/lib/useFocus';
import { IUserCredentials } from '@/api/user';
import { ILoginResponse } from '@/pages/api/auth/login';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';

const initialParams: IUserCredentials = { email: '', password: '' };

export default function LoginPage() {
  const { reload } = useRouter();
  const [params, setParams] = useState<IUserCredentials>(initialParams);
  const [mainInputRef, focus] = useFocus<HTMLInputElement>();

  const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    setParams((prevParams) => ({ ...prevParams, [name]: value }));
  };

  const {
    mutate: submit,
    data,
    isError,
    isPending,
    error,
  } = useMutation<ILoginResponse, null, IUserCredentials>({
    mutationKey: ['login'],
    mutationFn: async (params) => {
      const { data } = await axios.post<ILoginResponse>('/api/auth/login', params);
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    gcTime: 0,
    retry: false,
  });

  // redirect on successful login
  useEffect(() => {
    if (data?.success) {
      reload();
    }
  }, [data?.success, reload]);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      submit(params);
    },
    [params, submit],
  );

  useEffect(() => {
    if (isError) {
      focus();
    }
  }, [isError]);

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
            <Button type="submit" isLoading={isPending}>
              Submit
            </Button>
            <LoginFormError error={error} isLoading={isPending} />
          </Stack>
        </form>
      </Container>
    </>
  );
}

const LoginFormError = ({ error, isLoading }: { error: string; isLoading: boolean }) => {
  if (!error || isLoading) {
    return null;
  }

  const getMsg = () => {
    switch (error) {
      case 'InvalidCredentials':
        return 'The username or password you entered is incorrect. Please try again.';
      case 'UserNotFound':
        return 'The account you are trying to access does not exist. Please check your username and try again.';
      case 'AccountValidation':
        return 'There seems to be a problem with your account validation. Please contact support for assistance.';
      case 'AccountNotVerified':
        return 'Your account has not been verified yet. Please check your email for the verification link.';
      case 'InvalidCSRF':
        return 'There was a problem with your request. Please refresh the page and try again.';
      default:
        return 'An unexpected error occurred while trying to sign you in. Please try again later.';
    }
  };

  return <Alert status="error">{getMsg()}</Alert>;
};
